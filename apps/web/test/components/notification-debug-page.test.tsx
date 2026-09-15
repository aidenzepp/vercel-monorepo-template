import { expect, test } from "bun:test";

import { Children, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

import NotificationDebugPage from "../../app/debug/notifications/page";
import { NotificationDebug } from "../../components/debug/notification-debug";
import { AppearanceSettingsBoundary } from "../../components/settings/appearance-settings";

test("pairs toast controls with the application theme control", () => {
  // SAFETY: NotificationDebugPage synchronously returns its authored main element outside production.
  const page = NotificationDebugPage() as ReactElement<{
    children: ReactNode;
  }>;
  const sections = Children.toArray(page.props.children);

  expect(sections).toHaveLength(3);
  expect(isValidElement(sections[1]) ? sections[1].type : null).toBe(
    AppearanceSettingsBoundary
  );
  expect(isValidElement(sections[2]) ? sections[2].type : null).toBe(
    NotificationDebug
  );
});
