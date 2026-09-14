import { expect, test } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

import { SignInMethodButton } from "../../components/auth/sign-in-method-button";

test("marks only the sign-in method that matches the last-used value", () => {
  const matchingMarkup = renderToStaticMarkup(
    <SignInMethodButton
      lastUsedLoginMethod="github"
      loading={false}
      method="github"
    >
      Continue with GitHub
    </SignInMethodButton>
  );
  const differentMarkup = renderToStaticMarkup(
    <SignInMethodButton
      lastUsedLoginMethod="google"
      loading={false}
      method="github"
    >
      Continue with GitHub
    </SignInMethodButton>
  );

  expect(matchingMarkup).toContain("Last Used");
  expect(differentMarkup).not.toContain("Last Used");
});
