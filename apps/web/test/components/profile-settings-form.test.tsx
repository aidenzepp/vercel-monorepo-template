import { expect, test } from "bun:test";

import { nameSchema } from "@workspace/better-auth/config/name";
import { usernameSchema } from "@workspace/better-auth/config/username";
import { renderToStaticMarkup } from "react-dom/server";

import {
  createProfileUpdate,
  ProfileSettingsForm,
  saveProfileWithSounds,
} from "../../components/settings/profile-settings-form";

/**
 * The profile values shared by regular and anonymous form cases.
 */
const profile = {
  name: "Temporary user",
  username: null,
};

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
  expect(markup).toMatch(
    /<button(?=[^>]*data-cuelume-toggle="press")[^>]*>Reset<\/button>/u
  );
});

test("plays loading until a profile save settles, then ready", async () => {
  const sounds: string[] = [];
  const { promise: saveHasSettled, resolve: resolveSave } =
    Promise.withResolvers<undefined>();
  const saving = saveProfileWithSounds({
    playSound: (sound) => {
      sounds.push(sound);
    },
    save: async () => {
      await saveHasSettled;
      return null;
    },
  });

  expect(sounds).toEqual(["loading"]);

  resolveSave();

  expect(await saving).toBeNull();
  expect(sounds).toEqual(["loading", "ready"]);
});

test("anonymous profile updates omit the username", () => {
  expect(
    createProfileUpdate(
      {
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
