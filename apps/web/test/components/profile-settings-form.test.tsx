import { expect, test } from "bun:test";

import { nameSchema } from "@workspace/better-auth/config/name";
import { usernameSchema } from "@workspace/better-auth/config/username";
import { renderToStaticMarkup } from "react-dom/server";

import {
  createProfileUpdate,
  ProfileSettingsForm,
  saveProfileWithOutcomeSound,
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

test("plays success only after a profile save succeeds", async () => {
  const sounds: string[] = [];
  const { promise: saveResult, resolve: resolveSave } =
    Promise.withResolvers<null>();
  const saving = saveProfileWithOutcomeSound({
    playSound: (sound) => {
      sounds.push(sound);
    },
    save: async () => await saveResult,
  });

  expect(sounds).toEqual([]);

  resolveSave(null);

  expect(await saving).toBeNull();
  expect(sounds).toEqual(["success"]);
});

test("plays error after a profile save returns a repairable issue", async () => {
  const sounds: string[] = [];
  const issue = await saveProfileWithOutcomeSound({
    playSound: (sound) => {
      sounds.push(sound);
    },
    save: async () =>
      await Promise.resolve({
        field: "root",
        message: "The profile could not be saved.",
      }),
  });

  expect(issue).toEqual({
    field: "root",
    message: "The profile could not be saved.",
  });
  expect(sounds).toEqual(["error"]);
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
