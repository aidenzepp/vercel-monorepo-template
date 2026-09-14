import { expect, test } from "bun:test";

import { ThemeProvider } from "@workspace/ui/next/theme-provider";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

import { AppearanceSettingsBoundary } from "../../components/settings/appearance-settings";

/**
 * Finds one appearance radio through its accessible name.
 *
 * @param container - The mounted Appearance settings card.
 * @param label - The theme preference exposed to assistive technology.
 * @returns The named radio, when the card rendered it.
 */
const findThemeRadio = (
  container: HTMLElement,
  label: string
): HTMLElement | null =>
  container.querySelector(`[role="radio"][aria-label="${label}"]`);

test("renders button-backed theme radios on the right", () => {
  window.localStorage.setItem("theme", "light");
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <ThemeProvider>
        <AppearanceSettingsBoundary />
      </ThemeProvider>
    );
  });

  const group = container.querySelector<HTMLElement>(
    '[role="radiogroup"][aria-labelledby="appearance-theme-label"]'
  );
  const field = group?.closest<HTMLElement>('[data-slot="field"]');
  const buttonRadios = group?.querySelectorAll(
    'button[data-slot="button"][role="radio"]'
  );
  const nativeRadios = group?.querySelectorAll('input[type="radio"]');

  expect(field?.dataset.orientation).toBe("horizontal");
  expect(group?.dataset.variant).toBe("segmented");
  expect(field?.querySelector('[data-slot="field-content"]')).not.toBeNull();
  expect(field?.lastElementChild).toBe(group ?? null);
  expect(buttonRadios).toHaveLength(3);
  expect(nativeRadios).toHaveLength(3);

  act(() => {
    root.unmount();
  });
  container.remove();
});

test("keeps browser-derived theme state out of server markup", () => {
  window.localStorage.setItem("theme", "dark");

  const markup = renderToStaticMarkup(
    <ThemeProvider>
      <AppearanceSettingsBoundary />
    </ThemeProvider>
  );

  expect(markup).toContain('aria-busy="true"');
  expect(markup).not.toContain('aria-checked="true"');
});

test("keeps theme choices usable after an unsupported stored preference", () => {
  window.localStorage.setItem("theme", "legacy");
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <ThemeProvider>
        <AppearanceSettingsBoundary />
      </ThemeProvider>
    );
  });

  const darkRadio = findThemeRadio(container, "Dark");

  act(() => {
    darkRadio?.click();
  });

  expect(window.localStorage.getItem("theme")).toBe("dark");
  expect(darkRadio?.getAttribute("aria-checked")).toBe("true");

  act(() => {
    root.unmount();
  });
  container.remove();
});

test("persists each theme preference immediately", () => {
  window.localStorage.setItem("theme", "light");
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <ThemeProvider>
        <AppearanceSettingsBoundary />
      </ThemeProvider>
    );
  });

  const systemRadio = findThemeRadio(container, "System");
  const lightRadio = findThemeRadio(container, "Light");
  const darkRadio = findThemeRadio(container, "Dark");

  act(() => {
    systemRadio?.click();
  });
  expect(window.localStorage.getItem("theme")).toBe("system");
  expect(systemRadio?.getAttribute("aria-checked")).toBe("true");

  act(() => {
    darkRadio?.click();
  });
  expect(window.localStorage.getItem("theme")).toBe("dark");
  expect(darkRadio?.getAttribute("aria-checked")).toBe("true");

  act(() => {
    lightRadio?.click();
  });
  expect(window.localStorage.getItem("theme")).toBe("light");
  expect(lightRadio?.getAttribute("aria-checked")).toBe("true");

  act(() => {
    root.unmount();
  });
  container.remove();
});

test("keeps the selected preference synchronized with the D shortcut", () => {
  window.localStorage.setItem("theme", "light");
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <ThemeProvider>
        <AppearanceSettingsBoundary />
      </ThemeProvider>
    );
  });

  const darkRadio = findThemeRadio(container, "Dark");

  expect(darkRadio?.getAttribute("aria-checked")).toBe("false");

  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
  });

  expect(window.localStorage.getItem("theme")).toBe("dark");
  expect(darkRadio?.getAttribute("aria-checked")).toBe("true");

  act(() => {
    root.unmount();
  });
  container.remove();
});

test("moves and selects within the radio group with arrow keys", async () => {
  window.localStorage.setItem("theme", "system");
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <ThemeProvider>
        <AppearanceSettingsBoundary />
      </ThemeProvider>
    );
  });

  const systemRadio = findThemeRadio(container, "System");
  const lightRadio = findThemeRadio(container, "Light");

  await act(async () => {
    systemRadio?.focus();
    systemRadio?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" })
    );
    await Promise.resolve();
  });

  expect(document.activeElement?.getAttribute("aria-label")).toBe("Light");
  expect(lightRadio?.getAttribute("aria-checked")).toBe("true");
  expect(window.localStorage.getItem("theme")).toBe("light");

  act(() => {
    root.unmount();
  });
  container.remove();
});
