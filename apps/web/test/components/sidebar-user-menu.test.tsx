import { expect, test } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

import {
  UserMenuAvatar,
  UserMenuIdentity,
} from "../../components/sidebar/sidebar-user-menu";

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
