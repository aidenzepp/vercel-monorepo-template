import { expect, test } from "bun:test";

import { ThemeProvider } from "@workspace/ui/next/theme-provider";
import { act } from "react";
import { createRoot } from "react-dom/client";

import { ThemeSettingsBoundary } from "../../components/debug/theme-settings";

/**
 * Finds radios through the visible or visually hidden text that labels them.
 *
 * @param container - The mounted theme prototype controls.
 * @param label - The option name exposed by each enclosing label.
 * @returns Every treatment's radio for the named theme option.
 */
const findThemeRadios = (
  container: HTMLElement,
  label: string
): HTMLElement[] =>
  [...container.querySelectorAll<HTMLElement>('[role="radio"]')].filter(
    (radio) =>
      radio.closest("label")?.textContent?.trim().startsWith(label) === true
  );

test("applies each theme preference immediately from either treatment", () => {
  window.localStorage.setItem("theme", "light");
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <ThemeProvider>
        <ThemeSettingsBoundary treatment="radio" />
        <ThemeSettingsBoundary treatment="segmented" />
      </ThemeProvider>
    );
  });

  const systemRadios = findThemeRadios(container, "System");
  const lightRadios = findThemeRadios(container, "Light");
  const darkRadios = findThemeRadios(container, "Dark");

  expect(systemRadios).toHaveLength(2);
  expect(lightRadios).toHaveLength(2);
  expect(darkRadios).toHaveLength(2);

  act(() => {
    systemRadios[0]?.click();
  });

  expect(window.localStorage.getItem("theme")).toBe("system");
  expect(
    [...systemRadios].map((radio) => radio.getAttribute("aria-checked"))
  ).toEqual(["true", "true"]);

  act(() => {
    darkRadios[1]?.click();
  });

  expect(window.localStorage.getItem("theme")).toBe("dark");
  expect(
    [...darkRadios].map((radio) => radio.getAttribute("aria-checked"))
  ).toEqual(["true", "true"]);

  act(() => {
    lightRadios[0]?.click();
  });

  expect(window.localStorage.getItem("theme")).toBe("light");
  expect(
    [...lightRadios].map((radio) => radio.getAttribute("aria-checked"))
  ).toEqual(["true", "true"]);

  act(() => {
    root.unmount();
  });
  container.remove();
});

test("keeps both treatments synchronized with the unmodified D shortcut", () => {
  window.localStorage.setItem("theme", "light");
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <ThemeProvider>
        <ThemeSettingsBoundary treatment="radio" />
        <ThemeSettingsBoundary treatment="segmented" />
      </ThemeProvider>
    );
  });

  const darkRadios = findThemeRadios(container, "Dark");

  expect(
    [...darkRadios].map((radio) => radio.getAttribute("aria-checked"))
  ).toEqual(["false", "false"]);

  act(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
  });

  expect(window.localStorage.getItem("theme")).toBe("dark");
  expect(
    [...darkRadios].map((radio) => radio.getAttribute("aria-checked"))
  ).toEqual(["true", "true"]);

  act(() => {
    root.unmount();
  });
  container.remove();
});
