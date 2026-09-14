import { expect, test } from "bun:test";

import { createFilesClient } from "files-sdk/client";
import { z } from "zod";

import {
  reconcileProfileAvatarFile,
  uploadProfileAvatarFile,
} from "../../lib/files/profile-avatar";
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
        message: "Choose a file whose extension matches its image format.",
        reason: "filename_type_mismatch",
      },
    },
    { status: 422 }
  );
};
validationGatewayFetch.preconnect = fetch.preconnect;

/**
 * Returns one failed owner-scoped avatar metadata response.
 *
 * @param status - The HTTP status emitted by the file gateway.
 * @param code - The Files SDK error code represented by the response.
 * @returns A gateway fetch implementation for reconciliation failures.
 */
const createFailedReconciliationFetch = (
  status: number,
  code: string
): typeof fetch => {
  /**
   * Emits the selected failed response without contacting a file gateway.
   *
   * @returns The deterministic reconciliation failure under test.
   */
  const gatewayFetch: typeof fetch = async () => {
    await Promise.resolve();
    return Response.json(
      { error: { code, message: "Provider detail must stay private." } },
      { status }
    );
  };
  gatewayFetch.preconnect = fetch.preconnect;
  return gatewayFetch;
};

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
        size: file.size,
        type: file.type,
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

  expect(uploaded.error.message).toBe("Choose an image up to 5 MiB.");
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
      return {
        key: "12345678-9abc-4def-8abc-123456789abc.png",
        size: file.size,
        type: file.type,
      };
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
          size: file.size,
          type: file.type,
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
    message: "Image uploads are unavailable.",
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
    message: "Choose a file whose extension matches its image format.",
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

test("returns a missing avatar to upload selection after reconciliation", async () => {
  const key = "avatars/12345678-9abc-4def-8abc-123456789abc.png";
  const client = createFilesClient(
    createProfileAvatarFilesOptions({
      fetchImpl: createFailedReconciliationFetch(404, "NotFound"),
    })
  );
  const reconciled = await reconcileProfileAvatarFile({
    file: new File(["avatar"], "portrait.png", { type: "image/png" }),
    key,
    reconcile: async (candidate) => await client.head(candidate),
  });

  expect(reconciled.ok).toBe(false);

  if (reconciled.ok) {
    throw new Error("A missing upload should return repair guidance.");
  }

  expect(reconciled.error).toMatchObject({
    code: "upload_missing",
    message: "The image didn’t finish uploading.",
    phase: "reconciliation",
    retryable: true,
    storageState: "not_uploaded",
  });
  expect(reconciled.error.pendingKey).toBeUndefined();
});

test("preserves a pending avatar when reconciliation needs sign-in", async () => {
  const key = "avatars/12345678-9abc-4def-8abc-123456789abc.png";
  const client = createFilesClient(
    createProfileAvatarFilesOptions({
      fetchImpl: createFailedReconciliationFetch(401, "Unauthorized"),
    })
  );
  const reconciled = await reconcileProfileAvatarFile({
    file: new File(["avatar"], "portrait.png", { type: "image/png" }),
    key,
    reconcile: async (candidate) => await client.head(candidate),
  });

  expect(reconciled.ok).toBe(false);

  if (reconciled.ok) {
    throw new Error("An expired session should return sign-in guidance.");
  }

  expect(reconciled.error).toMatchObject({
    code: "session_expired",
    message: "Your session expired.",
    pendingKey: key,
    phase: "reconciliation",
    retryable: true,
    storageState: "unknown",
  });
});

test("distinguishes forbidden reconciliation from an expired session", async () => {
  const key = "avatars/12345678-9abc-4def-8abc-123456789abc.png";
  const client = createFilesClient(
    createProfileAvatarFilesOptions({
      fetchImpl: createFailedReconciliationFetch(403, "Forbidden"),
    })
  );
  const reconciled = await reconcileProfileAvatarFile({
    file: new File(["avatar"], "portrait.png", { type: "image/png" }),
    key,
    reconcile: async (candidate) => await client.head(candidate),
  });

  expect(reconciled.ok).toBe(false);

  if (reconciled.ok) {
    throw new Error("A forbidden upload should return access guidance.");
  }

  expect(reconciled.error).toMatchObject({
    code: "upload_forbidden",
    message: "This image upload isn’t allowed.",
    pendingKey: key,
    phase: "reconciliation",
    retryable: true,
    storageState: "unknown",
  });
});

test("reconciles the issued key when completion returns another avatar", async () => {
  const expectedKey = "12345678-9abc-4def-8abc-123456789abc.png";
  const otherKey = "87654321-cba9-4fed-8abc-abcdef123456.png";
  const avatar = new File(["avatar"], "portrait.png", { type: "image/png" });
  let reconciliations = 0;
  /**
   * Returns an upload completion response for a different valid avatar key.
   *
   * @param _input - The user-files endpoint, unused by this deterministic stub.
   * @param init - The Files SDK request carrying the current operation.
   * @returns A valid presign response or mismatched completion response.
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
            key: expectedKey,
            target: {
              headers: { "Content-Type": "image/png" },
              method: "PUT",
              url: "https://blob.example/signed-upload",
            },
          },
        ],
      });
    }

    return Response.json({
      files: [
        {
          etag: "other-etag",
          key: otherKey,
          lastModified: "2026-09-14T00:00:00.000Z",
          size: avatar.size,
          type: avatar.type,
        },
      ],
    });
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
      reconciliations += 1;
      await Promise.resolve();
      expect(key).toBe(`avatars/${expectedKey}`);
      return { key, size: avatar.size, type: avatar.type };
    },
    upload: async (file) => await client.upload(file),
  });

  expect(uploaded).toEqual({
    ok: true,
    value: {
      url: `/api/files?op=download&key=avatars%2F${expectedKey}`,
    },
  });
  expect(reconciliations).toBe(1);
});

test("rejects uploaded metadata that does not match the selected image", async () => {
  const avatar = new File(["avatar"], "portrait.png", { type: "image/png" });
  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    upload: async () => {
      await Promise.resolve();
      return {
        key: "12345678-9abc-4def-8abc-123456789abc.png",
        size: avatar.size + 1,
        type: "image/png",
      };
    },
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("Mismatched uploaded metadata should fail closed.");
  }

  expect(uploaded.error).toMatchObject({
    code: "invalid_uploaded_avatar_metadata",
    message: "We couldn’t verify the uploaded image.",
    phase: "completion",
    retryable: false,
    storageState: "uploaded",
  });
});

test("rejects an uploaded key outside the generated avatar grammar", async () => {
  const avatar = new File(["avatar"], "portrait.png", { type: "image/png" });
  const uploaded = await uploadProfileAvatarFile({
    file: avatar,
    upload: async () => {
      await Promise.resolve();
      return {
        key: "documents/profile.png",
        size: avatar.size,
        type: avatar.type,
      };
    },
  });

  expect(uploaded.ok).toBe(false);

  if (uploaded.ok) {
    throw new Error("An unexpected upload key should fail closed.");
  }

  expect(uploaded.error.message).toBe("We couldn’t verify the uploaded image.");
  expect(uploaded.error).toMatchObject({
    code: "invalid_uploaded_avatar_key",
    phase: "completion",
    retryable: false,
    storageState: "uploaded",
  });
});
