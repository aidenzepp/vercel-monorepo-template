import { expect, mock, spyOn, test } from "bun:test";

import { nameSchema } from "@workspace/better-auth/config/name";
import { usernameSchema } from "@workspace/better-auth/config/username";
import { result } from "@workspace/utils/result";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

import { ProfileSettingsForm } from "../../components/settings/profile-settings-form";
import {
  createProfileUpdate,
  ProfileSettingsSaveError,
  saveProfile,
} from "../../components/settings/profile-settings-save";
import type { ProfileSettingsSaveResult } from "../../components/settings/profile-settings-save";
import { ProfileAvatarError } from "../../lib/files/profile-avatar";

/**
 * The profile values shared by regular and anonymous form cases.
 */
const profile = {
  image:
    "/api/files?op=download&key=avatars%2F01234567-89ab-4cde-8fab-0123456789ab.png",
  name: "Temporary user",
  username: null,
};

/**
 * Behaves like a browser image that has already loaded successfully.
 */
class LoadedImage {
  complete = true;
  crossOrigin: string | null = null;
  naturalWidth = 1;
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;
  referrerPolicy = "";
  sizes = "";
  src = "";
  srcset = "";
}

/**
 * Captures the file submitted by the mounted profile form.
 */
interface AvatarSubmission {
  avatar: File | null;
}

/**
 * Narrows a save result to the repair state required by a failure scenario.
 *
 * @param saved - The explicit success or failure returned by profile saving.
 * @returns The structured profile error under test.
 */
const requireProfileSaveError = (
  saved: ProfileSettingsSaveResult
): ProfileSettingsSaveError => {
  if (saved.ok) {
    throw new Error("The profile save should have failed.");
  }

  return saved.error;
};

test("profile avatar changes move through preview, reset, and saved states", async () => {
  const NativeImage = window.Image;
  const createObjectURL = spyOn(URL, "createObjectURL")
    .mockReturnValueOnce("blob:https://templ8.test/first-preview")
    .mockReturnValueOnce("blob:https://templ8.test/second-preview");
  const revokeObjectURL = spyOn(URL, "revokeObjectURL").mockImplementation(
    () => {}
  );
  const savedAvatar =
    "/api/files?op=download&key=avatars%2F12345678-9abc-4def-8abc-123456789abc.png";
  const submission: AvatarSubmission = { avatar: null };
  let uploadResets = 0;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  Object.defineProperty(window, "Image", {
    configurable: true,
    value: LoadedImage,
  });

  act(() => {
    root.render(
      <ProfileSettingsForm
        canEditProfile
        onReset={() => {
          uploadResets += 1;
        }}
        onSave={async (settings) => {
          await Promise.resolve();
          submission.avatar =
            settings.avatar.kind === "selected" ? settings.avatar.file : null;
          return result.pass({ avatar: savedAvatar });
        }}
        user={profile}
      />
    );
  });

  const form = container.querySelector<HTMLFormElement>("form");
  const input = container.querySelector<HTMLInputElement>("#settings-avatar");
  const avatarDisplay = container.querySelector<HTMLElement>(
    '[data-slot="avatar"]'
  );
  const avatarDescription = container.querySelector<HTMLElement>(
    "#settings-avatar-description"
  );
  const avatarLabel = container.querySelector<HTMLLabelElement>(
    'label[for="settings-avatar"]'
  );
  const reset = [...container.querySelectorAll("button")].find(
    (button) => button.textContent === "Reset"
  );

  if (
    avatarDescription === null ||
    avatarDisplay === null ||
    avatarLabel === null ||
    form === null ||
    input === null ||
    reset === undefined
  ) {
    throw new Error(
      "The mounted profile form should expose avatar editing controls."
    );
  }

  const fieldColumn = input.parentElement;

  expect(fieldColumn?.contains(avatarLabel)).toBe(true);
  expect(fieldColumn?.contains(avatarDescription)).toBe(true);
  expect(fieldColumn?.contains(avatarDisplay)).toBe(false);
  expect(fieldColumn?.nextElementSibling).toBe(avatarDisplay);
  expect(
    container.querySelector<HTMLImageElement>('[data-slot="avatar-image"]')?.src
  ).toBe(new URL(profile.image, window.location.href).href);
  expect(input.type).toBe("file");
  expect(input.accept).toBe("image/jpeg,image/png,image/webp");

  const firstAvatar = new File(["first"], "first.png", {
    type: "image/png",
  });
  let clearedFileInputCount = 0;
  Object.defineProperty(input, "value", {
    configurable: true,
    get: () =>
      clearedFileInputCount > 0 ? "" : String.raw`C:\fakepath\first.png`,
    set: (value: string) => {
      if (value === "") {
        clearedFileInputCount += 1;
      }
    },
  });
  Object.defineProperty(input, "files", {
    configurable: true,
    value: {
      0: firstAvatar,
      item: (index: number) => (index === 0 ? firstAvatar : null),
      length: 1,
    },
  });

  act(() => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  expect(
    container.querySelector<HTMLImageElement>('[data-slot="avatar-image"]')?.src
  ).toBe("blob:https://templ8.test/first-preview");
  expect(clearedFileInputCount).toBe(0);

  act(() => {
    reset.click();
  });

  expect(
    container.querySelector<HTMLImageElement>('[data-slot="avatar-image"]')?.src
  ).toBe(new URL(profile.image, window.location.href).href);
  expect(revokeObjectURL).toHaveBeenCalledWith(
    "blob:https://templ8.test/first-preview"
  );
  expect(clearedFileInputCount).toBe(1);
  expect(uploadResets).toBe(1);

  const secondAvatar = new File(["second"], "second.png", {
    type: "image/png",
  });
  Object.defineProperty(input, "files", {
    configurable: true,
    value: {
      0: secondAvatar,
      item: (index: number) => (index === 0 ? secondAvatar : null),
      length: 1,
    },
  });

  act(() => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await act(async () => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );
    await Promise.resolve();
  });

  expect(createObjectURL).toHaveBeenCalledTimes(2);
  expect(submission.avatar).toBe(secondAvatar);
  expect(
    container.querySelector<HTMLImageElement>('[data-slot="avatar-image"]')?.src
  ).toBe(new URL(savedAvatar, window.location.href).href);
  expect(revokeObjectURL).toHaveBeenCalledWith(
    "blob:https://templ8.test/second-preview"
  );
  expect(clearedFileInputCount).toBe(2);

  act(() => {
    root.unmount();
  });
  container.remove();
  createObjectURL.mockRestore();
  revokeObjectURL.mockRestore();
  Object.defineProperty(window, "Image", {
    configurable: true,
    value: NativeImage,
  });
});

test("profile avatar selection does not depend on File constructor identity", async () => {
  const createObjectURL = spyOn(URL, "createObjectURL").mockReturnValue(
    "blob:https://templ8.test/cross-realm-preview"
  );
  const revokeObjectURL = spyOn(URL, "revokeObjectURL").mockImplementation(
    () => {}
  );
  const submission: AvatarSubmission = { avatar: null };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <ProfileSettingsForm
        canEditProfile
        onSave={async (settings) => {
          await Promise.resolve();
          submission.avatar =
            settings.avatar.kind === "selected" ? settings.avatar.file : null;
          return result.pass({ avatar: profile.image });
        }}
        user={profile}
      />
    );
  });

  const form = container.querySelector<HTMLFormElement>("form");
  const input = container.querySelector<HTMLInputElement>("#settings-avatar");

  if (form === null || input === null) {
    throw new Error("The mounted profile form should expose avatar editing.");
  }

  // SAFETY: This Blob supplies every browser File field the form reads while
  // deliberately preserving a different constructor identity.
  const selectedAvatar = Object.assign(
    new Blob(["avatar"], { type: "image/png" }),
    {
      lastModified: 0,
      name: "avatar.png",
      webkitRelativePath: "",
    }
  ) as File;
  expect(selectedAvatar).not.toBeInstanceOf(File);
  Object.defineProperty(input, "files", {
    configurable: true,
    value: {
      0: selectedAvatar,
      item: (index: number) => (index === 0 ? selectedAvatar : null),
      length: 1,
    },
  });

  act(() => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await act(async () => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );
    await Promise.resolve();
  });

  expect(submission.avatar).toBe(selectedAvatar);

  act(() => {
    root.unmount();
  });
  container.remove();
  createObjectURL.mockRestore();
  revokeObjectURL.mockRestore();
});

test("profile avatar save failures render beside the file input", async () => {
  const createObjectURL = spyOn(URL, "createObjectURL").mockReturnValue(
    "blob:https://templ8.test/error-preview"
  );
  const revokeObjectURL = spyOn(URL, "revokeObjectURL").mockImplementation(
    () => {}
  );
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <ProfileSettingsForm
        canEditProfile
        onSave={async () => {
          await Promise.resolve();
          return result.fail(
            new ProfileSettingsSaveError(
              "avatar",
              "Image uploads are unavailable. Your image is still selected."
            )
          );
        }}
        user={profile}
      />
    );
  });

  const form = container.querySelector<HTMLFormElement>("form");
  const input = container.querySelector<HTMLInputElement>("#settings-avatar");

  if (form === null || input === null) {
    throw new Error("The mounted profile form should expose avatar editing.");
  }

  const selectedAvatar = new File(["avatar"], "avatar.png", {
    type: "image/png",
  });
  Object.defineProperty(input, "files", {
    configurable: true,
    value: {
      0: selectedAvatar,
      item: (index: number) => (index === 0 ? selectedAvatar : null),
      length: 1,
    },
  });

  act(() => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await act(async () => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true })
    );
    await Promise.resolve();
  });

  const error = container.querySelector<HTMLElement>("#settings-avatar-error");

  expect(error?.textContent).toBe(
    "Image uploads are unavailable. Your image is still selected."
  );
  expect(error?.getAttribute("role")).toBe("alert");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(input.getAttribute("aria-errormessage")).toBe("settings-avatar-error");

  act(() => {
    root.unmount();
  });
  container.remove();
  createObjectURL.mockRestore();
  revokeObjectURL.mockRestore();
});

test("anonymous profile forms disable the complete profile fieldset", () => {
  const markup = renderToStaticMarkup(
    <ProfileSettingsForm
      canEditProfile={false}
      onSave={() => {
        throw new Error("Static form rendering must not submit profile data.");
      }}
      user={profile}
    />
  );

  expect(markup).toMatch(/<fieldset[^>]*disabled=""/u);
  expect(markup).toContain('id="settings-avatar"');
  expect(markup).toContain('id="settings-name"');
  expect(markup).toContain('id="settings-username"');
  expect(markup).toContain(
    "Temporary accounts cannot change profile settings."
  );
  expect(markup).not.toContain("Temporary accounts cannot claim a username.");

  const usernameInput = /<input(?=[^>]*id="settings-username")[^>]*>/u.exec(
    markup
  )?.[0];
  const usernameGroup = /<div(?=[^>]*data-slot="input-group")[^>]*>/u.exec(
    markup
  )?.[0];
  const fieldset = /<fieldset[^>]*>[\s\S]*<\/fieldset>/u.exec(markup)?.[0];

  expect(usernameInput).not.toContain(' disabled=""');
  expect(usernameGroup).not.toContain("data-disabled");
  expect(fieldset).toContain("Save changes");
});

test("profile form actions opt into press sounds", () => {
  const markup = renderToStaticMarkup(
    <ProfileSettingsForm
      canEditProfile={false}
      onSave={() => {
        throw new Error("Static form rendering must not submit profile data.");
      }}
      user={profile}
    />
  );

  expect(markup).toMatch(
    /<button(?=[^>]*data-cuelume-toggle="press")[^>]*>Reset<\/button>/u
  );
  expect(markup).toMatch(
    /<button(?=[^>]*data-cuelume-toggle="press")[^>]*>Save changes<\/button>/u
  );
});

test("anonymous profile saves stop before identity and avatar operations", async () => {
  let identityRequests = 0;
  let uploadRequests = 0;
  const avatar = new File(["avatar"], "avatar.png", { type: "image/png" });

  const saved = await saveProfile({
    canEditProfile: false,
    settings: {
      avatar: {
        file: avatar,
        kind: "selected",
        previewUrl: "blob:https://templ8.test/avatar-preview",
      },
      name: nameSchema.parse("Guest author"),
      username: usernameSchema.parse("claimed_name"),
    },
    updateUser: async () => {
      identityRequests += 1;
      await Promise.resolve();
      return { error: null };
    },
    uploadAvatar: async () => {
      uploadRequests += 1;
      await Promise.resolve();
      return result.pass({
        url: "/api/files?op=download&key=avatars%2Favatar.png",
      });
    },
  });

  expect(requireProfileSaveError(saved)).toMatchObject({
    field: "root",
    message: "Temporary accounts cannot change profile settings.",
  });
  expect(identityRequests).toBe(0);
  expect(uploadRequests).toBe(0);
});

test("regular profile updates include a selected username", () => {
  expect(
    createProfileUpdate({
      avatar: { kind: "persisted", url: null },
      name: nameSchema.parse("Aiden Zepp"),
      username: usernameSchema.parse("aiden"),
    })
  ).toEqual({
    name: nameSchema.parse("Aiden Zepp"),
    username: usernameSchema.parse("aiden"),
  });
});

test("profile saves send a selected avatar directly to its upload capability", async () => {
  const avatar = new File([new Uint8Array(2 * 1024 * 1024)], "avatar.png", {
    type: "image/png",
  });
  const avatarUrl =
    "/api/files?op=download&key=avatars%2F12345678-9abc-4def-8abc-123456789abc.png";
  const operations: string[] = [];
  const updates: {
    image?: string;
    name?: string;
    username?: string;
  }[] = [];
  const uploadAvatar = mock(async (_file: File) => {
    operations.push("upload");
    await Promise.resolve();
    return result.pass({ url: avatarUrl });
  });
  const updateUser = mock(async (update: (typeof updates)[number]) => {
    operations.push("update");
    updates.push(update);
    await Promise.resolve();
    return { data: null, error: null };
  });

  const saved = await saveProfile({
    canEditProfile: true,
    settings: {
      avatar: {
        file: avatar,
        kind: "selected",
        previewUrl: "blob:https://templ8.test/avatar-preview",
      },
      name: nameSchema.parse("Aiden Zepp"),
      username: usernameSchema.parse("aiden"),
    },
    updateUser,
    uploadAvatar,
  });

  expect(saved).toEqual(result.pass({ avatar: avatarUrl }));
  expect(operations).toEqual(["update", "upload", "update"]);
  expect(updates).toEqual([
    {
      name: nameSchema.parse("Aiden Zepp"),
      username: usernameSchema.parse("aiden"),
    },
    { image: avatarUrl },
  ]);
  expect(uploadAvatar.mock.calls[0]?.[0]).toBe(avatar);
});

test("profile saves reject a username before uploading its avatar", async () => {
  const avatar = new File(["avatar"], "avatar.png", { type: "image/png" });
  const uploadAvatar = mock(() => {
    throw new Error("A rejected username must make zero upload requests.");
  });
  const updateUser = mock(async () => {
    await Promise.resolve();
    return {
      data: null,
      error: { code: "USERNAME_IS_ALREADY_TAKEN", status: 422 },
    };
  });

  const saved = await saveProfile({
    canEditProfile: true,
    settings: {
      avatar: {
        file: avatar,
        kind: "selected",
        previewUrl: "blob:https://templ8.test/avatar-preview",
      },
      name: nameSchema.parse("Aiden Zepp"),
      username: usernameSchema.parse("already.taken"),
    },
    updateUser,
    uploadAvatar,
  });

  expect(requireProfileSaveError(saved)).toMatchObject({
    field: "username",
    message: "That username is already taken. Choose another.",
  });
  expect(uploadAvatar).not.toHaveBeenCalled();
});

test("profile saves keep avatar validation failures with the file field", async () => {
  const avatar = new File(["avatar"], "avatar.svg", {
    type: "image/svg+xml",
  });
  const uploadAvatar = mock(async (_file: File) => {
    await Promise.resolve();
    throw new Error("Invalid avatars must stop before the upload capability.");
  });
  const updates: { name?: string; username?: string }[] = [];
  const updateUser = mock(async (update: (typeof updates)[number]) => {
    updates.push(update);
    await Promise.resolve();
    return { data: null, error: null };
  });

  const saved = await saveProfile({
    canEditProfile: true,
    settings: {
      avatar: {
        file: avatar,
        kind: "selected",
        previewUrl: "blob:https://templ8.test/avatar-preview",
      },
      name: nameSchema.parse("Aiden Zepp"),
      username: usernameSchema.parse("aiden"),
    },
    updateUser,
    uploadAvatar,
  });

  expect(requireProfileSaveError(saved)).toMatchObject({
    field: "avatar",
    message: "Choose a JPEG, PNG, or WebP image.",
  });
  expect(updates).toHaveLength(0);
  expect(uploadAvatar).not.toHaveBeenCalled();
});

test("profile saves explain when the session expired", async () => {
  const saved = await saveProfile({
    canEditProfile: true,
    settings: {
      avatar: { kind: "persisted", url: profile.image },
      name: nameSchema.parse("Aiden Zepp"),
      username: usernameSchema.parse("aiden"),
    },
    updateUser: async () => {
      await Promise.resolve();
      return { error: { code: "SESSION_EXPIRED", status: 401 } };
    },
    uploadAvatar: () => {
      throw new Error("An expired session must stop before avatar upload.");
    },
  });

  expect(requireProfileSaveError(saved)).toMatchObject({
    field: "root",
    message: "Your session expired. Sign in again. Your edits are still here.",
  });
});

test("profile saves retry attachment without uploading the same avatar twice", async () => {
  const avatar = new File(["avatar"], "avatar.png", { type: "image/png" });
  const avatarUrl =
    "/api/files?op=download&key=avatars%2F12345678-9abc-4def-8abc-123456789abc.png";
  const uploadAvatar = mock(async () => {
    await Promise.resolve();
    return result.pass({ url: avatarUrl });
  });
  let avatarUpdates = 0;
  const updateUser = mock(async (update: { image?: string }) => {
    await Promise.resolve();

    if (update.image !== undefined) {
      avatarUpdates += 1;
      return {
        error:
          avatarUpdates === 1
            ? { code: "PROFILE_UPDATE_FAILED", status: 503 }
            : null,
      };
    }

    return { error: null };
  });
  const selectedAvatar = {
    file: avatar,
    kind: "selected" as const,
    previewUrl: "blob:https://templ8.test/avatar-preview",
  };

  const firstSave = await saveProfile({
    canEditProfile: true,
    settings: {
      avatar: selectedAvatar,
      name: nameSchema.parse("Aiden Zepp"),
      username: usernameSchema.parse("aiden"),
    },
    updateUser,
    uploadAvatar,
  });

  const firstError = requireProfileSaveError(firstSave);

  expect(firstError).toMatchObject({
    avatarState: {
      ...selectedAvatar,
      kind: "uploaded",
      savedIdentity: {
        name: nameSchema.parse("Aiden Zepp"),
        username: usernameSchema.parse("aiden"),
      },
      url: avatarUrl,
    },
    field: "avatar",
    message:
      "The image uploaded but wasn’t attached. Save again; we’ll reuse it.",
  });

  if (firstError.avatarState === undefined) {
    throw new Error("A failed attachment should preserve its uploaded URL.");
  }

  const secondSave = await saveProfile({
    canEditProfile: true,
    settings: {
      avatar: firstError.avatarState,
      name: nameSchema.parse("Aiden Zepp"),
      username: usernameSchema.parse("aiden"),
    },
    updateUser,
    uploadAvatar,
  });

  expect(secondSave).toEqual(result.pass({ avatar: avatarUrl }));
  expect(uploadAvatar).toHaveBeenCalledTimes(1);
  expect(updateUser).toHaveBeenCalledTimes(3);
  expect(avatarUpdates).toBe(2);
});

test("profile saves retry an upload without repeating the saved identity", async () => {
  const avatar = new File(["avatar"], "avatar.png", { type: "image/png" });
  const avatarUrl =
    "/api/files?op=download&key=avatars%2F12345678-9abc-4def-8abc-123456789abc.png";
  let uploadAttempts = 0;
  const updateUser = mock(async () => {
    await Promise.resolve();
    return { error: null };
  });
  const uploadAvatar = mock(async () => {
    uploadAttempts += 1;
    await Promise.resolve();

    if (uploadAttempts === 1) {
      throw new Error("connection reset during upload");
    }

    return result.pass({ url: avatarUrl });
  });
  const settings = {
    avatar: {
      file: avatar,
      kind: "selected" as const,
      previewUrl: "blob:https://templ8.test/avatar-preview",
    },
    name: nameSchema.parse("Aiden Zepp"),
    username: usernameSchema.parse("aiden"),
  };

  const firstSave = await saveProfile({
    canEditProfile: true,
    settings,
    updateUser,
    uploadAvatar,
  });
  const firstError = requireProfileSaveError(firstSave);

  expect(firstError.avatarState).toMatchObject({
    ...settings.avatar,
    savedIdentity: {
      name: settings.name,
      username: settings.username,
    },
  });
  expect(firstError.message).toBe(
    "We couldn’t confirm the upload. Your other changes were saved. Check your connection and save again."
  );

  if (firstError.avatarState === undefined) {
    throw new Error("An upload retry should preserve its saved identity.");
  }

  const secondSave = await saveProfile({
    canEditProfile: true,
    settings: { ...settings, avatar: firstError.avatarState },
    updateUser,
    uploadAvatar,
  });

  expect(secondSave).toEqual(result.pass({ avatar: avatarUrl }));
  expect(uploadAvatar).toHaveBeenCalledTimes(2);
  expect(updateUser).toHaveBeenCalledTimes(2);
});

test("profile saves reupload an avatar that reconciliation proves missing", async () => {
  const avatar = new File(["avatar"], "avatar.png", { type: "image/png" });
  const avatarUrl =
    "/api/files?op=download&key=avatars%2F12345678-9abc-4def-8abc-123456789abc.png";
  const savedIdentity = {
    name: nameSchema.parse("Aiden Zepp"),
    username: usernameSchema.parse("aiden"),
  };
  const updateUser = mock(async () => {
    await Promise.resolve();
    return { error: null };
  });
  const uploadAvatar = mock(async () => {
    await Promise.resolve();
    return result.pass({ url: avatarUrl });
  });
  const reconcileAvatar = mock(async () => {
    await Promise.resolve();
    return result.fail(
      new ProfileAvatarError("The image didn’t finish uploading.", {
        code: "upload_missing",
        phase: "reconciliation",
        retryable: true,
        storageState: "not_uploaded",
      })
    );
  });
  const settings = {
    avatar: {
      file: avatar,
      key: "avatars/87654321-cba9-4fed-8abc-abcdef123456.png",
      kind: "pending" as const,
      previewUrl: "blob:https://templ8.test/avatar-preview",
      savedIdentity,
    },
    ...savedIdentity,
  };

  const firstSave = await saveProfile({
    canEditProfile: true,
    reconcileAvatar,
    settings,
    updateUser,
    uploadAvatar,
  });
  const firstError = requireProfileSaveError(firstSave);

  expect(firstError).toMatchObject({
    avatarState: {
      file: avatar,
      kind: "selected",
      previewUrl: settings.avatar.previewUrl,
      savedIdentity,
    },
    field: "avatar",
    message:
      "The image didn’t finish uploading. Your other changes were saved. Save again to upload it.",
  });

  if (firstError.avatarState === undefined) {
    throw new Error("A missing upload should return to selected state.");
  }

  const secondSave = await saveProfile({
    canEditProfile: true,
    reconcileAvatar,
    settings: { ...settings, avatar: firstError.avatarState },
    updateUser,
    uploadAvatar,
  });

  expect(secondSave).toEqual(result.pass({ avatar: avatarUrl }));
  expect(reconcileAvatar).toHaveBeenCalledTimes(1);
  expect(uploadAvatar).toHaveBeenCalledTimes(1);
  expect(updateUser).toHaveBeenCalledTimes(1);
});

test("profile saves explain when attachment retries are rate limited", async () => {
  const avatar = new File(["avatar"], "avatar.png", { type: "image/png" });
  const avatarUrl =
    "/api/files?op=download&key=avatars%2F12345678-9abc-4def-8abc-123456789abc.png";
  const saved = await saveProfile({
    canEditProfile: true,
    settings: {
      avatar: {
        file: avatar,
        kind: "selected",
        previewUrl: "blob:https://templ8.test/avatar-preview",
      },
      name: nameSchema.parse("Aiden Zepp"),
      username: usernameSchema.parse("aiden"),
    },
    updateUser: async (update) => {
      await Promise.resolve();
      return {
        error:
          update.image === undefined
            ? null
            : { code: "TOO_MANY_REQUESTS", status: 429 },
      };
    },
    uploadAvatar: async () => {
      await Promise.resolve();
      return result.pass({ url: avatarUrl });
    },
  });

  expect(requireProfileSaveError(saved)).toMatchObject({
    avatarState: { kind: "uploaded", url: avatarUrl },
    field: "root",
    message:
      "Too many changes. Wait a moment, then save again. We’ll reuse the uploaded image.",
  });
});
