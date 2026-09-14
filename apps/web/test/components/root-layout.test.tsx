import { expect, mock, test } from "bun:test";

import type { ReactElement } from "react";

await mock.module("next/font/google", () => ({
  Geist_Mono: () => ({
    className: "font-mono",
    style: { fontFamily: "test-mono" },
    variable: "__variable_mono",
  }),
  Outfit: () => ({
    className: "font-sans",
    style: { fontFamily: "test-sans" },
    variable: "__variable_sans",
  }),
  Roboto_Slab: () => ({
    className: "font-heading",
    style: { fontFamily: "test-heading" },
    variable: "__variable_heading",
  }),
}));

test("contains viewport overscroll within the web document surface", async () => {
  const { default: RootLayout } = await import("../../app/layout");
  // SAFETY: RootLayout synchronously returns the authored document root.
  const layout = RootLayout({ children: null }) as ReactElement<{
    className: string;
  }>;
  const rootClasses = layout.props.className.split(" ");

  expect(layout.type).toBe("html");
  expect(rootClasses).toContain("bg-background");
  expect(rootClasses).toContain("overscroll-none");
});
