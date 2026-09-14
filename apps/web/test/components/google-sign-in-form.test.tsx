import { afterEach, expect, test } from "bun:test";

import { act } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import {
  GoogleSignInForm,
  GoogleSignInFormBoundary,
} from "../../components/auth/google-sign-in-form";

afterEach(() => {
  Reflect.deleteProperty(document, "cookie");
});

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

test("recovers Google sign-in after a failed request", async () => {
  const failedRequest = Promise.withResolvers<string | null>();
  const retryRequest = Promise.withResolvers<string | null>();
  let requestCount = 0;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <GoogleSignInForm
        onSignIn={async () => {
          requestCount += 1;
          return await (requestCount === 1
            ? failedRequest.promise
            : retryRequest.promise);
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
    failedRequest.resolve("Google sign-in couldn’t be opened. Try again.");
    await failedRequest.promise;
  });

  expect(container.textContent).toContain(
    "Google sign-in couldn’t be opened. Try again."
  );
  expect(button.disabled).toBe(false);
  expect(button.getAttribute("aria-busy")).toBeNull();
  expect(button.textContent).toContain("Continue with Google");

  await act(async () => {
    button.click();
    await Promise.resolve();
  });

  expect(requestCount).toBe(2);
  expect(button.disabled).toBe(true);

  await act(async () => {
    retryRequest.resolve(null);
    await retryRequest.promise;
  });

  expect(button.disabled).toBe(false);
  expect(button.getAttribute("aria-busy")).toBeNull();
  expect(button.textContent).toContain("Continue with Google");
  expect(container.textContent).not.toContain(
    "Google sign-in couldn’t be opened. Try again."
  );

  act(() => {
    root.unmount();
  });
  container.remove();
});

test("marks Google from Better Auth's remembered login method", () => {
  Object.defineProperty(document, "cookie", {
    configurable: true,
    value: "better-auth.last_used_login_method=google",
  });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(<GoogleSignInFormBoundary redirectErrorMessage={null} />);
  });

  expect(container.textContent).toContain("Last Used");

  act(() => {
    root.unmount();
  });
  container.remove();
});

test("restores Google's remembered marker after server hydration", async () => {
  const container = document.createElement("div");
  container.innerHTML = renderToString(
    <GoogleSignInFormBoundary redirectErrorMessage={null} />
  );
  document.body.append(container);
  Object.defineProperty(document, "cookie", {
    configurable: true,
    value: "better-auth.last_used_login_method=google",
  });

  const root = hydrateRoot(
    container,
    <GoogleSignInFormBoundary redirectErrorMessage={null} />
  );

  await act(async () => {
    await Promise.resolve();
  });

  expect(container.textContent).toContain("Last Used");

  act(() => {
    root.unmount();
  });
  container.remove();
});
