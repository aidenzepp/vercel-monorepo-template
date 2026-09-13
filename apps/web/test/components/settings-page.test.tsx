import { expect, test } from "bun:test";

import { Children, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

import SettingsPage from "../../app/(app)/settings/page";
import { AppearanceSettingsBoundary } from "../../components/settings/appearance-settings";
import { ProfileSettingsFormBoundary } from "../../components/settings/profile-settings-form";
import { SoundSettingsBoundary } from "../../components/settings/sound-settings";

test("places Appearance before Profile and Sound settings", () => {
  // SAFETY: SettingsPage synchronously returns the root settings element authored in this module.
  const page = SettingsPage() as ReactElement<{ children: ReactNode }>;
  const sections = Children.toArray(page.props.children);

  expect(sections).toHaveLength(4);
  expect(isValidElement(sections[1]) ? sections[1].type : null).toBe(
    AppearanceSettingsBoundary
  );
  expect(isValidElement(sections[2]) ? sections[2].type : null).toBe(
    ProfileSettingsFormBoundary
  );
  expect(isValidElement(sections[3]) ? sections[3].type : null).toBe(
    SoundSettingsBoundary
  );
});
