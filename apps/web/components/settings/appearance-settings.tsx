"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@workspace/ui/components/field";
import {
  RadioGroup,
  RadioGroupButton,
} from "@workspace/ui/components/radio-group";
import type { Icon } from "@workspace/ui/icons";
import { Monitor, MoonStars, Sun } from "@workspace/ui/icons";
import { useTheme } from "@workspace/ui/next/theme-provider";
import { useSyncExternalStore } from "react";

/**
 * A browser-persisted appearance preference supported by the application.
 */
type ThemePreference = "dark" | "light" | "system";

/**
 * A labeled theme preference rendered by the appearance radio group.
 */
interface ThemeOption {
  description: string;
  icon: Icon;
  label: string;
  value: ThemePreference;
}

interface AppearanceSettingsProps {
  disabled: boolean;
  onThemeChange: (theme: ThemePreference) => void;
  theme: ThemePreference | "";
}

/**
 * The browser appearance choices displayed by application settings.
 */
const THEME_OPTIONS = [
  {
    description: "Follow this device's appearance setting.",
    icon: Monitor,
    label: "System",
    value: "system",
  },
  {
    description: "Keep the interface light.",
    icon: Sun,
    label: "Light",
    value: "light",
  },
  {
    description: "Keep the interface dark.",
    icon: MoonStars,
    label: "Dark",
    value: "dark",
  },
] satisfies readonly ThemeOption[];

/**
 * Supplies the no-op subscription required for a hydration snapshot.
 *
 * @returns An inert unsubscribe callback.
 */
const subscribeToHydration = (): (() => void) => () => {
  // Hydration itself changes the snapshot; no browser event is required.
};

/**
 * Reports whether browser-owned theme state can render without a mismatch.
 *
 * @returns Whether React has hydrated the client-side theme consumer.
 */
const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );

/**
 * Narrows a next-themes value to the preferences offered by Settings.
 *
 * @param theme - The current next-themes preference, when available.
 * @returns Whether the value is one of the displayed theme choices.
 */
const isThemePreference = (
  theme: string | undefined
): theme is ThemePreference =>
  theme === "system" || theme === "light" || theme === "dark";

/**
 * Displays one icon button within the appearance radio group.
 *
 * @param props - The appearance option represented by the button.
 * @param props.description - Supplies the native hover explanation.
 * @param props.icon - Identifies the theme choice visually.
 * @param props.label - Names the icon-only radio for assistive technology.
 * @param props.value - Supplies the persisted next-themes preference.
 * @returns One shared icon button with native radio semantics.
 */
const ThemePreferenceButton = ({
  description,
  icon: Icon,
  label,
  value,
}: ThemeOption) => (
  <RadioGroupButton
    aria-label={label}
    data-cuelume-toggle="toggle"
    title={`${label}: ${description}`}
    value={value}
  >
    <Icon aria-hidden="true" className="size-5" />
  </RadioGroupButton>
);

/**
 * Displays the feature-specific chrome around the semantic theme radio group.
 *
 * @param props - The current theme state and immediate change intent.
 * @param props.disabled - Prevents interaction before browser theme state is
 *   ready.
 * @param props.onThemeChange - Applies a selected next-themes preference.
 * @param props.theme - Supplies the persisted preference or no hydration-time
 *   selection.
 * @returns The compact theme preference control used by Appearance settings.
 */
const ThemePreferenceControl = ({
  disabled,
  onThemeChange,
  theme,
}: AppearanceSettingsProps) => (
  <div
    className="border-border bg-background w-fit shrink-0 rounded-full border p-1 shadow-xs data-disabled:opacity-60"
    data-disabled={disabled || undefined}
    data-slot="theme-preference-control"
  >
    <RadioGroup
      aria-busy={disabled}
      aria-describedby="appearance-theme-description"
      aria-labelledby="appearance-theme-label"
      className="flex w-fit gap-1"
      disabled={disabled}
      onValueChange={onThemeChange}
      value={theme}
    >
      {THEME_OPTIONS.map((option) => (
        <ThemePreferenceButton key={option.value} {...option} />
      ))}
    </RadioGroup>
  </div>
);

/**
 * Displays the application's browser-local appearance preference.
 *
 * @param props - The current theme state and immediate change intent.
 * @param props.disabled - Prevents interaction before browser theme state is
 *   ready.
 * @param props.onThemeChange - Applies a selected next-themes preference.
 * @param props.theme - Supplies the persisted preference or no hydration-time
 *   selection.
 * @returns The Appearance card used by application settings.
 */
const AppearanceSettings = ({
  disabled,
  onThemeChange,
  theme,
}: AppearanceSettingsProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Appearance</CardTitle>
      <CardDescription>Choose how templ8 looks on this device.</CardDescription>
    </CardHeader>
    <CardContent>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle id="appearance-theme-label">Theme</FieldTitle>
          <FieldDescription id="appearance-theme-description">
            Changes apply immediately and stay with this browser.
          </FieldDescription>
        </FieldContent>
        <ThemePreferenceControl
          disabled={disabled}
          onThemeChange={onThemeChange}
          theme={theme}
        />
      </Field>
    </CardContent>
  </Card>
);

/**
 * Connects Appearance settings to shared browser theme state.
 *
 * @returns Appearance settings synchronized with persistence and the global
 *   shortcut.
 */
const AppearanceSettingsBoundary = () => {
  const hydrated = useHydrated();
  const { setTheme, theme } = useTheme();
  const currentTheme = hydrated && isThemePreference(theme) ? theme : "";

  return (
    <AppearanceSettings
      disabled={!hydrated}
      onThemeChange={setTheme}
      theme={currentTheme}
    />
  );
};

export { AppearanceSettings, AppearanceSettingsBoundary };
