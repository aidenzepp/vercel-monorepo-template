import { expect, test } from "bun:test";

import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

import {
  SidebarUserMenu,
  UserMenuAvatar,
  UserMenuIdentity,
} from "../../components/sidebar/sidebar-user-menu";

/**
 * Mounts the prop-driven account menu with a supplied sign-out result.
 *
 * @param onSignOut - Handles a confirmed sign-out request.
 * @param isAnonymous - Selects the regular or temporary account flow.
 * @returns The mounted menu container and its React root.
 */
const mountUserMenu = (
  onSignOut: () => Promise<string | null>,
  isAnonymous = false
) => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <SidebarProvider>
        <SidebarUserMenu
          onSignOut={onSignOut}
          user={{
            id: "user-1",
            image: null,
            isAnonymous,
            name: isAnonymous ? "Temporary user" : "Aiden Zepp",
            username: isAnonymous ? null : "aiden",
          }}
        />
      </SidebarProvider>
    );
  });

  return { container, root };
};

test("user menu identity shows the user's public identity", () => {
  const markup = renderToStaticMarkup(
    <UserMenuIdentity isAnonymous={false} name="Aiden Zepp" username="aiden" />
  );

  expect(markup).toContain("Aiden Zepp");
  expect(markup).toContain("@aiden");
});

test("user menu identity falls back when the username is missing", () => {
  const markup = renderToStaticMarkup(
    <UserMenuIdentity isAnonymous={false} name="Aiden Zepp" username={null} />
  );

  expect(markup).toContain("Username not set");
});

test("regular user avatars fall back when the image is missing", () => {
  const markup = renderToStaticMarkup(
    <UserMenuAvatar image={null} isAnonymous={false} />
  );

  expect(markup).toContain("lucide-user-round");
});

test("anonymous user menu identity uses the temporary-account fallback", () => {
  const markup = renderToStaticMarkup(
    <>
      <UserMenuAvatar image="https://example.com/ignored.png" isAnonymous />
      <UserMenuIdentity isAnonymous name="Ignored" username="ignored" />
    </>
  );

  expect(markup).toContain("lucide-hat-glasses");
  expect(markup).toContain("Temporary user");
  expect(markup).toContain("Anonymous session");
});

test("signs out immediately from the account menu", async () => {
  let signOutCalls = 0;
  const { container, root } = mountUserMenu(async () => {
    signOutCalls += 1;
    return await Promise.resolve(null);
  });
  const menuTrigger = container.querySelector<HTMLButtonElement>(
    '[data-slot="dropdown-menu-trigger"]'
  );

  if (menuTrigger === null) {
    throw new Error("The sidebar account trigger should be mounted.");
  }

  act(() => {
    menuTrigger.click();
  });

  const signOutItem = [
    ...document.body.querySelectorAll<HTMLElement>(
      '[data-slot="dropdown-menu-item"]'
    ),
  ].find((item) => item.textContent?.includes("Sign out"));

  if (signOutItem === undefined) {
    throw new Error("The account menu should expose sign out.");
  }

  await act(async () => {
    signOutItem.click();
    await Promise.resolve();
  });

  expect(signOutCalls).toBe(1);
  expect(document.body.querySelector('[role="alertdialog"]')).toBeNull();

  act(() => {
    root.unmount();
  });
  container.remove();
});
