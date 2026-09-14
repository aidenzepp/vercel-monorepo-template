import { expect, test } from "bun:test";

import { createFilesClient } from "files-sdk/client";
import { z } from "zod";

import { uploadProfileAvatarFile } from "../../lib/files/profile-avatar";
import { createProfileAvatarFilesOptions } from "../../lib/files/profile-avatar-client";

/**
 * Returns a provider failure before the client receives a signed upload target.
 *
 * @returns The unavailable gateway response used by presign failure coverage.
 */
const unavailableGatewayFetch: typeof fetch = async () => {
  await Promise.resolve();
  return Response.json(
    {
      error: {
        code: "Provider",
        message: "Direct file uploads are temporarily unavailable.",
      },
    },
    { status: 500 }
  );
};
unavailableGatewayFetch.preconnect = fetch.preconnect;

/**
 * Returns one structured avatar validation failure from the upload gateway.
 *
 * @returns The typed validation response used to verify client propagation.
 */
const validationGatewayFetch: typeof fetch = async () => {
  await Promise.resolve();
  return Response.json(
    {
      error: {
        code: "Validation",
        details: {
          actualName: "avatar.png",
          expectedExtension: "jpg",
        },
        message: "The image filename does not match its selected format.",
        reason: "filename_type_mismatch",
      },
    },
    { status: 422 }
  );
};
validationGatewayFetch.preconnect = fetch.preconnect;

test("uploads a canonical avatar file and returns its private gateway URL", async () => {
  const uploads: File[] = [];
  const avatar = new File(["avatar"], "portrait.png", {
    type: "image/png",
  });

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    upload: async (file) => {
      await Promise.resolve();
      uploads.push(file);
      return {
        key: "12345678-9abc-4def-8abc-123456789abc.png",
      };
    },
  });

  expect(uploaded.ok).toBe(true);

  if (!uploaded.ok) {
    throw new Error("A valid avatar should return its uploaded URL.");
  }

  expect(uploaded.value.url).toBe(
    "/api/files?op=download&key=avatars%2F12345678-9abc-4def-8abc-123456789abc.png"
  );
  expect(uploads).toHaveLength(1);
  expect(uploads[0]?.name).toBe("avatar.png");
  expect(uploads[0]?.size).toBe(avatar.size);
  expect(uploads[0]?.type).toBe("image/png");
});

test("rejects unsupported avatar formats before requesting an upload", async () => {
  const avatar = new File(["avatar"], "portrait.svg", {
    type: "image/svg+xml",
  });

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    upload: () => {
      throw new Error("Invalid avatars must not reach Blob storage.");
    },
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("An unsupported avatar should return a validation error.");
  }

  expect(uploaded.error.message).toBe("Choose a JPEG, PNG, or WebP image.");
});

test("rejects avatars larger than five mebibytes before requesting an upload", async () => {
  const avatar = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
    type: "image/png",
  });

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    upload: () => {
      throw new Error("Oversized avatars must not reach Blob storage.");
    },
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("An oversized avatar should return a validation error.");
  }

  expect(uploaded.error.message).toBe(
    "Choose an image that’s 5 MiB or smaller."
  );
  expect(uploaded.error).toMatchObject({
    code: "too_large",
    details: {
      actualBytes: 5 * 1024 * 1024 + 1,
      maxBytes: 5 * 1024 * 1024,
    },
    phase: "validation",
    retryable: false,
    storageState: "not_uploaded",
  });
});

test("accepts an avatar exactly five mebibytes large", async () => {
  const avatar = new File([new Uint8Array(5 * 1024 * 1024)], "large.png", {
    type: "image/png",
  });

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    upload: async (file) => {
      await Promise.resolve();
      expect(file.size).toBe(5 * 1024 * 1024);
      return { key: "12345678-9abc-4def-8abc-123456789abc.png" };
    },
  });

  expect(uploaded.ok).toBe(true);
});

test.each([
  { extension: "jpg", name: "portrait.jpeg", type: "image/jpeg" },
  { extension: "webp", name: "portrait.webp", type: "image/webp" },
])(
  "accepts $type avatars with canonical $extension keys",
  async (candidate) => {
    const uploaded = await uploadProfileAvatarFile({
      file: new File(["avatar"], candidate.name, { type: candidate.type }),
      upload: async (file) => {
        await Promise.resolve();
        expect(file.name).toBe(`avatar.${candidate.extension}`);
        expect(file.type).toBe(candidate.type);
        return {
          key: `12345678-9abc-4def-8abc-123456789abc.${candidate.extension}`,
        };
      },
    });

    expect(uploaded.ok).toBe(true);
  }
);

test("reports signed-target failures before sending image bytes", async () => {
  let transferRequests = 0;
  const client = createFilesClient(
    createProfileAvatarFilesOptions({
      fetchImpl: unavailableGatewayFetch,
      transport: async () => {
        transferRequests += 1;
        await Promise.resolve();
        return { status: 200, text: "" };
      },
    })
  );

  const uploaded = await uploadProfileAvatarFile({
    file: new File(["avatar"], "portrait.png", { type: "image/png" }),
    upload: async (file) => await client.upload(file),
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("A missing signed target should return repair guidance.");
  }

  expect(uploaded.error).toMatchObject({
    code: "upload_unavailable",
    message: "Image uploads are temporarily unavailable.",
    phase: "presign",
    retryable: true,
    storageState: "not_uploaded",
  });
  expect(transferRequests).toBe(0);
});

test("preserves structured gateway validation through the files client", async () => {
  let transferRequests = 0;
  const client = createFilesClient(
    createProfileAvatarFilesOptions({
      fetchImpl: validationGatewayFetch,
      transport: async () => {
        transferRequests += 1;
        await Promise.resolve();
        return { status: 200, text: "" };
      },
    })
  );
  const uploaded = await uploadProfileAvatarFile({
    file: new File(["avatar"], "portrait.png", { type: "image/png" }),
    upload: async (file) => await client.upload(file),
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("Gateway validation should remain a typed avatar failure.");
  }

  expect(uploaded.error).toMatchObject({
    code: "filename_type_mismatch",
    details: {
      actualName: "avatar.png",
      expectedExtension: "jpg",
    },
    message: "The image filename does not match its selected format.",
    phase: "validation",
    retryable: false,
    storageState: "not_uploaded",
  });
  expect(transferRequests).toBe(0);
});

test("reconciles a stored image when completion cannot be confirmed", async () => {
  const uploadedKey = "12345678-9abc-4def-8abc-123456789abc.png";
  const avatar = new File(["avatar"], "portrait.png", { type: "image/png" });
  /**
   * Issues one signed target before simulating an unavailable completion route.
   *
   * @param _input - The user-files endpoint, unused by this deterministic stub.
   * @param init - The Files SDK JSON request containing its operation.
   * @returns The presign success or completion failure response.
   */
  const fetchImpl: typeof fetch = async (_input, init) => {
    const encodedRequest = z.string().parse(init?.body);
    const requestJson: unknown = JSON.parse(encodedRequest);
    const request = z.object({ op: z.string() }).parse(requestJson);
    await Promise.resolve();

    if (request.op === "presign") {
      return Response.json({
        uploads: [
          {
            id: "signed-completion-token",
            key: uploadedKey,
            target: {
              headers: { "Content-Type": "image/png" },
              method: "PUT",
              url: "https://blob.example/signed-upload",
            },
          },
        ],
      });
    }

    return Response.json(
      {
        error: {
          code: "Provider",
          message: "Completion is temporarily unavailable.",
        },
      },
      { status: 503 }
    );
  };
  fetchImpl.preconnect = fetch.preconnect;
  const client = createFilesClient(
    createProfileAvatarFilesOptions({
      fetchImpl,
      transport: async () => {
        await Promise.resolve();
        return { status: 200, text: "" };
      },
    })
  );

  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    reconcile: async (key) => {
      await Promise.resolve();
      expect(key).toBe(`avatars/${uploadedKey}`);
      return { key, size: avatar.size, type: avatar.type };
    },
    upload: async (file) => await client.upload(file),
  });

  expect(uploaded).toEqual({
    ok: true,
    value: {
      url: `/api/files?op=download&key=avatars%2F${uploadedKey}`,
    },
  });
});

test("rejects an uploaded key outside the generated avatar grammar", async () => {
  const uploaded = await uploadProfileAvatarFile({
    file: new File(["avatar"], "portrait.png", { type: "image/png" }),
    upload: async () => {
      await Promise.resolve();
      return { key: "documents/profile.png" };
    },
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("An unexpected upload key should fail closed.");
  }

  expect(uploaded.error.message).toBe(
    "The upload returned an invalid avatar location."
  );
  expect(uploaded.error).toMatchObject({
    code: "invalid_uploaded_avatar_key",
    phase: "completion",
    retryable: false,
    storageState: "uploaded",
  });
});
