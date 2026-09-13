import { expect, mock, spyOn, test } from "bun:test";

import { nameSchema } from "@workspace/better-auth/config/name";
import { usernameSchema } from "@workspace/better-auth/config/username";
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
  image: "https://blob.example/users/user-1/avatar.png",
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
    "https://assets.public.blob.vercel-storage.com/users/user_123/avatars/avatar.png";
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
        canEditUsername
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
  ).toBe(profile.image);
  expect(input.type).toBe("file");
  expect(input.accept).toBe("image/jpeg,image/png,image/webp");

  const firstAvatar = new File(["first"], "first.png", {
    type: "image/png",
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

  act(() => {
    reset.click();
  });

  expect(
    container.querySelector<HTMLImageElement>('[data-slot="avatar-image"]')?.src
  ).toBe(profile.image);
  expect(revokeObjectURL).toHaveBeenCalledWith(
    "blob:https://templ8.test/first-preview"
  );

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
  ).toBe(savedAvatar);
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

test("anonymous profile forms disable the username field", () => {
  const markup = renderToStaticMarkup(
    <ProfileSettingsForm
      canEditUsername={false}
      onSave={() => {
        throw new Error("Static form rendering must not submit profile data.");
      }}
      user={profile}
    />
  );

  expect(markup).toContain('id="settings-username"');
  expect(markup).toContain('id="settings-username" disabled=""');
});

test("profile form actions opt into press sounds", () => {
  const markup = renderToStaticMarkup(
    <ProfileSettingsForm
      canEditUsername={false}
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

test("anonymous profile updates omit the username", () => {
  expect(
    createProfileUpdate(
      {
        avatar: { kind: "persisted", url: null },
        name: nameSchema.parse("Guest author"),
        username: usernameSchema.parse("claimed_name"),
      },
      false
    )
  ).toEqual({ name: nameSchema.parse("Guest author") });
});

test("regular profile updates include a selected username", () => {
  expect(
    createProfileUpdate(
      {
        avatar: { kind: "persisted", url: null },
        name: nameSchema.parse("Aiden Zepp"),
        username: usernameSchema.parse("aiden"),
      },
      true
    )
  ).toEqual({
    name: nameSchema.parse("Aiden Zepp"),
    username: usernameSchema.parse("aiden"),
  });
});

test("profile updates include a newly uploaded avatar URL", () => {
  expect(
    createProfileUpdate(
      {
        avatar: { kind: "persisted", url: null },
        name: nameSchema.parse("Aiden Zepp"),
        username: usernameSchema.parse("aiden"),
      },
      true,
      "https://assets.public.blob.vercel-storage.com/users/user_123/avatars/avatar.png"
    )
  ).toEqual({
    image:
      "https://assets.public.blob.vercel-storage.com/users/user_123/avatars/avatar.png",
    name: nameSchema.parse("Aiden Zepp"),
    username: usernameSchema.parse("aiden"),
  });
});

test("profile saves upload a selected avatar and persist its URL", async () => {
  const avatar = new File(["avatar"], "avatar.png", { type: "image/png" });
  const avatarUrl =
    "https://assets.public.blob.vercel-storage.com/users/user_123/avatars/avatar.png";
  const uploadAvatar = mock(async (_formData: FormData) => {
    await Promise.resolve();
    return { ok: true as const, url: avatarUrl };
  });
  const updateUser = mock(async () => {
    await Promise.resolve();
    return { data: null, error: null };
  });

  const saved = await saveProfile({
    canEditUsername: true,
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
  expect(uploadAvatar).toHaveBeenCalledTimes(1);
  expect(uploadAvatar.mock.calls[0]?.[0].get("avatar")).toBe(avatar);
  expect(updateUser).toHaveBeenCalledWith({
    image: avatarUrl,
    name: nameSchema.parse("Aiden Zepp"),
    username: usernameSchema.parse("aiden"),
  });
});

test("profile saves keep avatar validation failures with the file field", async () => {
  const avatar = new File(["avatar"], "avatar.svg", {
    type: "image/svg+xml",
  });
  const uploadAvatar = mock(async (_formData: FormData) => {
    await Promise.resolve();
    return {
      message: "Choose a JPEG, PNG, or WebP image.",
      ok: false as const,
    };
  });
  const updateUser = mock(() => {
    throw new Error("Invalid avatars must stop the profile update.");
  });

  const saved = await saveProfile({
    canEditUsername: true,
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
  expect(updateUser).not.toHaveBeenCalled();
});
