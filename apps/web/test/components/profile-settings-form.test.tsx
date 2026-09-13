import { expect, mock, spyOn, test } from "bun:test";

import { nameSchema } from "@workspace/better-auth/config/name";
import { usernameSchema } from "@workspace/better-auth/config/username";
import { result } from "@workspace/utils/result";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

import {
  createProfileUpdate,
  ProfileSettingsForm,
  saveProfile,
} from "../../components/settings/profile-settings-form";

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
        onSave={async (settings) => {
          await Promise.resolve();
          submission.avatar =
            settings.avatar.kind === "selected" ? settings.avatar.file : null;
          return { avatar: savedAvatar, issue: null };
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
  let selectedFileWasCleared = false;
  Object.defineProperty(input, "value", {
    configurable: true,
    get: () =>
      selectedFileWasCleared ? "" : String.raw`C:\fakepath\first.png`,
    set: (value: string) => {
      if (value === "") {
        selectedFileWasCleared = true;
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
  expect(selectedFileWasCleared).toBe(false);

  act(() => {
    reset.click();
  });

  expect(
    container.querySelector<HTMLImageElement>('[data-slot="avatar-image"]')?.src
  ).toBe(new URL(profile.image, window.location.href).href);
  expect(revokeObjectURL).toHaveBeenCalledWith(
    "blob:https://templ8.test/first-preview"
  );
  expect(selectedFileWasCleared).toBe(true);

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
          return { avatar: profile.image, issue: null };
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
    userId: "anonymous_123",
  });

  expect(saved).toEqual({
    issue: {
      field: "root",
      message: "Temporary accounts cannot change profile settings.",
    },
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

test("profile saves upload a selected avatar and persist its URL", async () => {
  const avatar = new File(["avatar"], "avatar.png", { type: "image/png" });
  const avatarUrl =
    "/api/files?op=download&key=avatars%2F12345678-9abc-4def-8abc-123456789abc.png";
  const operations: string[] = [];
  const updates: {
    image?: string;
    name?: string;
    username?: string;
  }[] = [];
  const uploadAvatar = mock(async (_formData: FormData) => {
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
    userId: "user_123",
  });

  expect(saved).toEqual({ avatar: avatarUrl, issue: null });
  expect(operations).toEqual(["update", "upload", "update"]);
  expect(updates).toEqual([
    {
      name: nameSchema.parse("Aiden Zepp"),
      username: usernameSchema.parse("aiden"),
    },
    { image: avatarUrl },
  ]);
  expect(uploadAvatar.mock.calls[0]?.[0].get("avatar")).toBe(avatar);
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
    userId: "user_123",
  });

  expect(saved).toEqual({
    issue: {
      field: "username",
      message: "That username is already taken. Choose another.",
    },
  });
  expect(uploadAvatar).not.toHaveBeenCalled();
});

test("profile saves keep avatar validation failures with the file field", async () => {
  const avatar = new File(["avatar"], "avatar.svg", {
    type: "image/svg+xml",
  });
  const uploadAvatar = mock(async (_formData: FormData) => {
    await Promise.resolve();
    return result.fail(new Error("Choose a JPEG, PNG, or WebP image."));
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
    userId: "user_123",
  });

  expect(saved).toEqual({
    issue: {
      field: "avatar",
      message: "Choose a JPEG, PNG, or WebP image.",
    },
  });
  expect(updates).toEqual([
    {
      name: nameSchema.parse("Aiden Zepp"),
      username: usernameSchema.parse("aiden"),
    },
  ]);
});
