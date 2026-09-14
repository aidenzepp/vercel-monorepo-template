"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import * as React from "react";

export { useTheme } from "next-themes";

/**
 * Determines whether a keyboard event belongs to an editable control.
 *
 * @param target - The event target receiving keyboard input.
 * @returns Whether the target should retain the unmodified D key.
 */
const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
};

/**
 * Toggles the resolved theme when the unmodified D key is pressed outside
 * inputs.
 *
 * @returns No visible content; this component installs the theme shortcut.
 */
const ThemeHotkey = () => {
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    /**
     * Applies the theme shortcut to one browser keyboard event.
     *
     * @param event - The keyboard event dispatched by the current window.
     */
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key.toLowerCase() !== "d") {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [resolvedTheme, setTheme]);

  return null;
};

/**
 * Mounts system-aware theme state and the repository's theme shortcut.
 *
 * @param props - The next-themes configuration and protected subtree.
 * @param props.children - Supplies content that consumes the active theme.
 * @returns The subtree configured with shared theme behavior.
 * @see https://github.com/pacocoursey/next-themes#themeprovider
 */
const ThemeProvider = ({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    disableTransitionOnChange
    enableSystem
    {...props}
  >
    <ThemeHotkey />
    {children}
  </NextThemesProvider>
);

export { ThemeProvider };
