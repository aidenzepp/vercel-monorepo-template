import { expect, test } from "bun:test";

import { Toaster } from "@workspace/ui/components/toast";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { NotificationDebug } from "../../components/debug/notification-debug";

/**
 * Finds a debug action by its visible label.
 *
 * @param container - The mounted notification debug controls.
 * @param label - The exact button label to find.
 * @returns The matching button, when present.
 */
const findButton = (
  container: HTMLElement,
  label: string
): HTMLButtonElement | undefined =>
  [...container.querySelectorAll<HTMLButtonElement>("button")].find(
    (button) => button.textContent === label
  );

/**
 * Finds an active toast by its visible title.
 *
 * @param title - The exact title identifying the toast.
 * @returns The matching toast root, when present.
 */
const findToast = (title: string): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>('[data-slot="toast"]')].find(
    (toastItem) =>
      toastItem.querySelector('[data-slot="toast-title"]')?.textContent ===
      title
  );

test("previews representative toast states and controls", () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <>
        <NotificationDebug />
        <Toaster />
      </>
    );
  });

  expect(
    ["Regular", "Success", "Info", "Warning", "Error", "Loading", "Action"].map(
      (label) => findButton(container, label)?.textContent
    )
  ).toEqual([
    "Regular",
    "Success",
    "Info",
    "Warning",
    "Error",
    "Loading",
    "Action",
  ]);

  act(() => {
    findButton(container, "Warning")?.click();
  });

  const warningToast = findToast("Your connection is unstable");

  expect(warningToast?.dataset.type).toBe("warning");
  expect(warningToast?.querySelector(".lucide-triangle-alert")).not.toBeNull();

  act(() => {
    findButton(container, "Action")?.click();
  });

  const actionToast = findToast("Message archived");

  expect(
    actionToast?.querySelector('[data-slot="toast-description"]')?.textContent
  ).toBe("The conversation was moved to your archive.");
  expect(
    actionToast?.querySelector('[data-slot="toast-action"]')?.textContent
  ).toBe("Undo");
  expect(
    actionToast?.querySelector('[data-slot="toast-close"]')
  ).not.toBeNull();

  act(() => {
    root.unmount();
  });
  container.remove();
});
