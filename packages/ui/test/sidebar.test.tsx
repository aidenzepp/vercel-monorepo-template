import { expect, test } from "bun:test";
import { setTimeout as waitForTooltipDelay } from "node:timers/promises";

import {
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

test("gives the sidebar trigger one click-backed toggle cue", () => {
  const markup = renderToStaticMarkup(
    <SidebarProvider>
      <SidebarTrigger />
    </SidebarProvider>
  );

  expect(markup).toMatch(
    /<button(?=[^>]*data-sidebar="trigger")(?=[^>]*data-cuelume-toggle="toggle")[^>]*>/u
  );
});

test("shows the sidebar action in its label and icon", () => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1024,
  });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <SidebarProvider>
        <SidebarTrigger />
      </SidebarProvider>
    );
  });

  const trigger = container.querySelector<HTMLButtonElement>(
    '[data-sidebar="trigger"]'
  );

  if (trigger === null) {
    throw new Error("The sidebar trigger should be mounted.");
  }

  expect(trigger.getAttribute("aria-label")).toBe("Close sidebar");
  expect(trigger.querySelector(".lucide-panel-left-close")).not.toBeNull();

  act(() => {
    trigger.click();
  });

  expect(trigger.getAttribute("aria-label")).toBe("Open sidebar");
  expect(trigger.querySelector(".lucide-panel-left-open")).not.toBeNull();

  act(() => {
    root.unmount();
  });
  container.remove();
});

test("waits before showing the current sidebar action to the right", async () => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1024,
  });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <SidebarProvider>
        <SidebarTrigger />
      </SidebarProvider>
    );
  });

  const trigger = container.querySelector<HTMLButtonElement>(
    '[data-sidebar="trigger"]'
  );

  if (trigger === null) {
    throw new Error("The sidebar trigger should be mounted.");
  }

  await act(async () => {
    trigger.dispatchEvent(
      new PointerEvent("pointerenter", {
        bubbles: true,
        pointerType: "mouse",
      })
    );
    trigger.dispatchEvent(new MouseEvent("mouseenter"));
    trigger.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    await Promise.resolve();
  });

  expect(
    document.body.querySelector('[data-slot="tooltip-content"]')
  ).toBeNull();

  await act(async () => {
    // Allow Base UI's standard 600 ms tooltip rest delay to elapse.
    await waitForTooltipDelay(650);
  });

  const tooltip = document.body.querySelector<HTMLElement>(
    '[data-slot="tooltip-content"]'
  );

  expect(tooltip).not.toBeNull();

  if (tooltip === null) {
    throw new Error("The sidebar trigger should expose its action tooltip.");
  }

  expect(tooltip.textContent).toContain("Close sidebar");
  expect(tooltip.parentElement?.dataset.side).toBe("right");

  act(() => {
    root.unmount();
  });
  container.remove();
});
