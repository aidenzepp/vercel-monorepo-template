import { expect, test } from "bun:test";
import { strict as assert } from "node:assert";

import { createToastManager, Toaster } from "@workspace/ui/components/toast";
import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

/**
 * A real isolated toast renderer and manager owned by one test.
 */
interface MountedToaster {
  container: HTMLDivElement;
  manager: ReturnType<typeof createToastManager<Record<string, never>>>;
  root: Root;
}

/**
 * The Nucleo glyph and semantic Fill Duo palette expected for each status.
 */
const SEMANTIC_ICON_CASES = [
  {
    fillClass: "fill-success",
    iconName: "badge-check",
    textClass: "text-success-foreground",
    title: "Changes saved",
    type: "success",
  },
  {
    fillClass: "fill-info",
    iconName: "circle-info",
    textClass: "text-info-foreground",
    title: "Update available",
    type: "info",
  },
  {
    fillClass: "fill-warning",
    iconName: "triangle-warning",
    textClass: "text-warning-foreground",
    title: "Connection unstable",
    type: "warning",
  },
  {
    fillClass: "fill-destructive",
    iconName: "octagon-warning",
    textClass: "text-destructive-foreground",
    title: "Could not save",
    type: "error",
  },
] as const;

/**
 * Mounts one toast system with a private manager.
 *
 * @returns The rendered toaster, its manager, and cleanup handles.
 */
const mountToaster = (): MountedToaster => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const manager = createToastManager<Record<string, never>>();

  act(() => {
    root.render(<Toaster toastManager={manager} />);
  });

  return { container, manager, root };
};

/**
 * Removes one mounted toast system and its host from the test document.
 *
 * @param mounted - The isolated toaster returned by {@link mountToaster}.
 * @param mounted.container - The DOM host removed after the renderer unmounts.
 * @param mounted.root - The React root whose effects and portal are released.
 */
const unmountToaster = ({ container, root }: MountedToaster): void => {
  act(() => {
    root.unmount();
  });
  container.remove();
};

/**
 * Finds a rendered toast by its visible title.
 *
 * @param title - The exact title identifying the toast.
 * @returns The matching toast root, when one is active.
 */
const findToast = (title: string): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>('[data-slot="toast"]')].find(
    (toastItem) =>
      toastItem.querySelector('[data-slot="toast-title"]')?.textContent ===
      title
  );

test("status icons use Nucleo Fill Duo glyphs with semantic Tailwind palettes", () => {
  const mounted = mountToaster();

  for (const {
    fillClass,
    iconName,
    textClass,
    title,
    type,
  } of SEMANTIC_ICON_CASES) {
    act(() => {
      mounted.manager.add({ title, type });
    });

    const toastItem = findToast(title);
    assert.ok(toastItem);

    const toastIcon = toastItem.querySelector<HTMLElement>(
      '[data-slot="toast-icon"]'
    );
    assert.ok(toastIcon);

    const icon = toastIcon.querySelector<SVGElement>(
      `[data-nucleo-icon="${iconName}"]`
    );
    assert.ok(icon);

    const baseLayer = icon.querySelector<SVGElement>('[data-color="color-2"]');
    assert.ok(baseLayer);

    const foregroundLayers = icon.querySelectorAll<SVGElement>(
      '[data-color="color-1"]'
    );

    expect(toastItem.classList.contains("bg-popover")).toBeTrue();
    expect(toastItem.classList.contains("text-popover-foreground")).toBeTrue();
    expect(
      [...toastItem.classList].some((className) =>
        className.startsWith("data-[type=")
      )
    ).toBeFalse();
    expect(toastIcon.querySelectorAll("svg")).toHaveLength(1);
    expect(icon.getAttribute("viewBox")).toBe("0 0 18 18");
    expect(icon.classList.contains("size-5")).toBeTrue();
    expect(icon.classList.contains(fillClass)).toBeTrue();
    expect(icon.classList.contains(textClass)).toBeTrue();
    expect(icon.getAttribute("fill")).toBe("currentColor");
    expect(baseLayer.getAttribute("fill")).toBeNull();
    expect(baseLayer.getAttribute("opacity")).toBe("0.4");
    expect(foregroundLayers.length).toBeGreaterThan(0);

    for (const layer of foregroundLayers) {
      expect(layer.getAttribute("fill")).toBe("currentColor");
    }

    expect(icon.querySelector("[stroke]")).toBeNull();
    expect(
      icon.querySelector('[fill="#000"], [fill="black"], [stroke="black"]')
    ).toBeNull();
  }

  unmountToaster(mounted);
});

test("loading toasts use the shared spinner", () => {
  const mounted = mountToaster();

  act(() => {
    mounted.manager.add({ title: "Saving changes", type: "loading" });
  });

  const loadingToast = findToast("Saving changes");

  expect(loadingToast?.querySelector('[data-slot="spinner"]')).not.toBeNull();

  unmountToaster(mounted);
});

test("toasts enter from a viewport centered along the top edge", () => {
  const mounted = mountToaster();

  act(() => {
    mounted.manager.add({ title: "Draft saved" });
  });

  const viewport = document.querySelector('[data-slot="toast-viewport"]');
  const toastItem = findToast("Draft saved");

  expect(viewport?.classList.contains("inset-x-4")).toBeTrue();
  expect(viewport?.classList.contains("top-4")).toBeTrue();
  expect(viewport?.classList.contains("mx-auto")).toBeTrue();
  expect(viewport?.classList.contains("bottom-4")).toBeFalse();
  expect(toastItem?.classList.contains("top-0")).toBeTrue();
  expect(toastItem?.classList.contains("origin-top")).toBeTrue();
  expect(
    toastItem?.classList.contains(
      "data-starting-style:[transform:translateY(-150%)]"
    )
  ).toBeTrue();

  unmountToaster(mounted);
});

test("toast headers align the icon, message, and close columns at the start", () => {
  const mounted = mountToaster();

  act(() => {
    mounted.manager.add({
      description: "Your settings are now current.",
      title: "Changes saved",
      type: "success",
    });
  });

  const toastItem = findToast("Changes saved");
  const header = toastItem?.querySelector('[data-slot="toast-header"]');
  const message = toastItem?.querySelector('[data-slot="toast-message"]');

  expect(header?.classList.contains("items-start")).toBeTrue();
  expect(message?.classList.contains("pt-1")).toBeTrue();
  expect(
    [...(header?.children ?? [])].map((child) =>
      child instanceof HTMLElement ? child.dataset.slot : undefined
    )
  ).toEqual(["toast-icon", "toast-message", "toast-close"]);

  unmountToaster(mounted);
});

test("toast actions render in a right-aligned footer", () => {
  const mounted = mountToaster();

  act(() => {
    mounted.manager.add({
      actionProps: {
        children: "Undo",
        onClick: () => {},
      },
      description: "The conversation was moved to your archive.",
      title: "Message archived",
    });
  });

  const toastItem = findToast("Message archived");
  const content = toastItem?.querySelector('[data-slot="toast-content"]');
  const footer = toastItem?.querySelector('[data-slot="toast-footer"]');

  expect(content?.lastElementChild).toBe(footer);
  expect(footer?.classList.contains("justify-end")).toBeTrue();
  expect(footer?.querySelector('[data-slot="toast-action"]')?.textContent).toBe(
    "Undo"
  );

  unmountToaster(mounted);
});

test("toast controls use secondary neutral buttons with press cues", () => {
  const mounted = mountToaster();

  act(() => {
    mounted.manager.add({
      actionProps: {
        children: "Undo",
        onClick: () => {},
      },
      title: "Message archived",
      type: "info",
    });
  });

  const toastItem = findToast("Message archived");
  const icon = toastItem?.querySelector('[data-slot="toast-icon"]');
  const title = toastItem?.querySelector('[data-slot="toast-title"]');
  const close = toastItem?.querySelector<HTMLElement>(
    '[data-slot="toast-close"]'
  );
  const action = toastItem?.querySelector<HTMLElement>(
    '[data-slot="toast-action"]'
  );

  expect(icon?.classList.contains("size-7")).toBeTrue();
  expect(icon?.querySelector("svg")?.classList.contains("size-5")).toBeTrue();
  expect(title?.classList.contains("text-sm")).toBeTrue();
  expect(close?.dataset.color).toBe("neutral");
  expect(close?.dataset.variant).toBe("secondary");
  expect(close?.dataset.cuelumeToggle).toBe("press");
  expect(close?.classList.contains("size-7")).toBeTrue();
  expect(action?.dataset.color).toBe("neutral");
  expect(action?.dataset.variant).toBe("secondary");
  expect(action?.dataset.cuelumeToggle).toBe("press");
  expect(action?.classList.contains("h-7")).toBeTrue();

  unmountToaster(mounted);
});
