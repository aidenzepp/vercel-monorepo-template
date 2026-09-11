import { expect, test } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

import {
  AnonymousProfilePreview,
  SessionProfilePreview,
} from "../../components/sidebar/session-profile";

test("session profile previews show the user's public identity", () => {
  const markup = renderToStaticMarkup(
    <SessionProfilePreview
      avatar="https://example.com/avatar.png"
      name="Aiden Zepp"
      username="aiden"
    />
  );

  expect(markup).toContain("Aiden Zepp");
  expect(markup).toContain("@aiden");
});

test("session profile previews fall back when public identity is missing", () => {
  const markup = renderToStaticMarkup(
    <SessionProfilePreview avatar={null} name="Aiden Zepp" username={null} />
  );

  expect(markup).toContain("lucide-user-round");
  expect(markup).toContain("Username not set");
});

test("anonymous profile previews always use the anonymous fallback", () => {
  const markup = renderToStaticMarkup(<AnonymousProfilePreview />);

  expect(markup).toContain("lucide-hat-glasses");
  expect(markup).toContain("Temporary user");
  expect(markup).toContain("Anonymous session");
});
