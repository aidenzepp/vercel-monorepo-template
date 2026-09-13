import { expect, test } from "bun:test";

import { act } from "react";
import { createRoot } from "react-dom/client";

import { GoogleSignInForm } from "../../components/auth/google-sign-in-form";

test("shows an OAuth callback error before a retry", () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <GoogleSignInForm
        onSignIn={async () => await Promise.resolve(null)}
        redirectErrorMessage="Google sign-in couldn’t be completed. Try again."
      />
    );
  });

  expect(container.textContent).toContain(
    "Google sign-in couldn’t be completed. Try again."
  );

  act(() => {
    root.unmount();
  });
  container.remove();
});

test("disables repeat submission and renders an action failure", async () => {
  const pending = Promise.withResolvers<string | null>();
  let requestCount = 0;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <GoogleSignInForm
        onSignIn={async () => {
          requestCount += 1;
          return await pending.promise;
        }}
        redirectErrorMessage={null}
      />
    );
  });

  const button = container.querySelector<HTMLButtonElement>("button");
  if (button === null) {
    throw new Error("The Google sign-in button should be mounted.");
  }

  await act(async () => {
    button.click();
    await Promise.resolve();
  });

  expect(requestCount).toBe(1);
  expect(button.disabled).toBe(true);
  expect(button.getAttribute("aria-busy")).toBe("true");
  expect(button.textContent).toContain("Opening Google…");

  act(() => {
    button.click();
  });
  expect(requestCount).toBe(1);

  await act(async () => {
    pending.resolve("Google sign-in couldn’t be opened. Try again.");
    await pending.promise;
  });

  expect(container.textContent).toContain(
    "Google sign-in couldn’t be opened. Try again."
  );

  act(() => {
    root.unmount();
  });
  container.remove();
});
