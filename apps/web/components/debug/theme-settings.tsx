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
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@workspace/ui/components/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { useTheme } from "@workspace/ui/next/theme-provider";
import type { LucideIcon } from "lucide-react";
import { Monitor, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

/**
 * A persisted next-themes preference offered by both debug controls.
 */
type ThemePreference = "dark" | "light" | "system";

/**
 * The temporary visual treatment selected by a public debug route.
 */
type ThemeTreatment = "radio" | "segmented";

/**
 * A visible and persisted choice shared by both theme treatments.
 */
interface ThemeOption {
  description: string;
  icon: LucideIcon;
  label: string;
  value: ThemePreference;
}

interface AppearanceSettingsCardProps {
  children: ReactNode;
}

interface ThemeControlProps {
  disabled: boolean;
  onThemeChange: (theme: ThemePreference) => void;
  theme: ThemePreference | "";
}

interface ThemeSettingsProps extends ThemeControlProps {
  treatment: ThemeTreatment;
}

interface ThemeSettingsBoundaryProps {
  treatment: ThemeTreatment;
}

/**
 * The theme choices shared by both temporary Appearance treatments.
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
    icon: Moon,
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
 * Reports whether the current render can safely display browser theme state.
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
 * Narrows a next-themes value to the three preferences offered here.
 *
 * @param theme - The current next-themes preference, when available.
 * @returns Whether the value is one of the displayed theme choices.
 */
const isThemePreference = (
  theme: string | undefined
): theme is ThemePreference =>
  theme === "system" || theme === "light" || theme === "dark";

/**
 * Displays the stable Appearance card around one theme control treatment.
 *
 * @param props - The theme control rendered inside the card.
 * @param props.children - Supplies the radio list or segmented switcher.
 * @returns The Appearance settings card used by both debug routes.
 */
const AppearanceSettingsCard = ({ children }: AppearanceSettingsCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Appearance</CardTitle>
      <CardDescription>Choose how templ8 looks on this device.</CardDescription>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

/**
 * Displays one labeled choice in the conventional theme radio list.
 *
 * @param props - The theme option rendered as a labeled radio row.
 * @param props.description - Explains the option's browser behavior.
 * @param props.icon - Identifies the option visually without replacing text.
 * @param props.label - Names the option visibly and accessibly.
 * @param props.value - Supplies the persisted next-themes preference.
 * @returns One full-width theme choice row.
 */
const ThemeRadioOption = ({
  description,
  icon: Icon,
  label,
  value,
}: ThemeOption) => (
  <FieldLabel className="cursor-pointer">
    <Field orientation="horizontal">
      <RadioGroupItem value={value} />
      <Icon aria-hidden="true" className="text-muted-foreground size-5" />
      <FieldContent>
        <FieldTitle>{label}</FieldTitle>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
    </Field>
  </FieldLabel>
);

/**
 * Displays the conventional labeled radio-list treatment.
 *
 * @param props - The resolved control state and immediate change intent.
 * @param props.disabled - Prevents interaction until client theme state is
 *   ready.
 * @param props.onThemeChange - Applies a selected next-themes preference.
 * @param props.theme - Supplies the persisted preference or no selection while
 *   hydrating.
 * @returns A labeled vertical radio group for System, Light, and Dark.
 */
const ThemeRadioControl = ({
  disabled,
  onThemeChange,
  theme,
}: ThemeControlProps) => (
  <FieldSet>
    <FieldLegend id="theme-radio-label">Theme</FieldLegend>
    <FieldDescription id="theme-radio-description">
      Changes apply immediately and stay with this browser.
    </FieldDescription>
    <RadioGroup
      aria-busy={disabled}
      aria-describedby="theme-radio-description"
      aria-labelledby="theme-radio-label"
      className="gap-2"
      disabled={disabled}
      onValueChange={onThemeChange}
      value={theme}
    >
      {THEME_OPTIONS.map((option) => (
        <ThemeRadioOption key={option.value} {...option} />
      ))}
    </RadioGroup>
  </FieldSet>
);

/**
 * Displays one icon choice inside the compact segmented theme switcher.
 *
 * @param props - The theme option represented by one pill segment.
 * @param props.description - Supplies the native hover explanation.
 * @param props.icon - Identifies the theme choice visually.
 * @param props.label - Names the icon-only radio for assistive technology.
 * @param props.value - Supplies the persisted next-themes preference.
 * @returns One labeled icon segment with native radio semantics.
 */
const ThemeSegmentedOption = ({
  description,
  icon: Icon,
  label,
  value,
}: ThemeOption) => (
  <FieldLabel
    className="text-muted-foreground hover:text-foreground has-data-checked:bg-muted has-data-checked:text-foreground has-[:focus-visible]:ring-ring/50 relative size-11 cursor-pointer items-center justify-center rounded-full transition-colors has-[:focus-visible]:ring-3"
    title={`${label}: ${description}`}
  >
    <RadioGroupItem className="sr-only after:hidden" value={value} />
    <Icon aria-hidden="true" className="size-5" strokeWidth={2.25} />
    <span className="sr-only">{label}</span>
  </FieldLabel>
);

/**
 * Displays the compact icon-only segmented theme treatment.
 *
 * @param props - The resolved control state and immediate change intent.
 * @param props.disabled - Prevents interaction until client theme state is
 *   ready.
 * @param props.onThemeChange - Applies a selected next-themes preference.
 * @param props.theme - Supplies the persisted preference or no selection while
 *   hydrating.
 * @returns A pill-shaped radio group for System, Light, and Dark.
 */
const ThemeSegmentedControl = ({
  disabled,
  onThemeChange,
  theme,
}: ThemeControlProps) => (
  <FieldSet>
    <FieldLegend id="theme-segmented-label">Theme</FieldLegend>
    <FieldDescription id="theme-segmented-description">
      Changes apply immediately and stay with this browser.
    </FieldDescription>
    <RadioGroup
      aria-busy={disabled}
      aria-describedby="theme-segmented-description"
      aria-labelledby="theme-segmented-label"
      className="border-border bg-background mt-1 flex w-fit gap-1 rounded-full border p-1 shadow-xs disabled:opacity-60"
      disabled={disabled}
      onValueChange={onThemeChange}
      value={theme}
    >
      {THEME_OPTIONS.map((option) => (
        <ThemeSegmentedOption key={option.value} {...option} />
      ))}
    </RadioGroup>
  </FieldSet>
);

/**
 * Displays one prop-driven Appearance treatment.
 *
 * @param props - The selected theme, treatment, and immediate change intent.
 * @param props.disabled - Prevents interaction while the persisted theme is
 *   unresolved.
 * @param props.onThemeChange - Applies the user's selected theme immediately.
 * @param props.theme - Supplies the persisted theme or no selection while
 *   hydrating.
 * @param props.treatment - Selects the conventional or segmented presentation.
 * @returns The requested Appearance card treatment.
 */
const ThemeSettings = ({
  disabled,
  onThemeChange,
  theme,
  treatment,
}: ThemeSettingsProps) => (
  <AppearanceSettingsCard>
    {treatment === "radio" ? (
      <ThemeRadioControl
        disabled={disabled}
        onThemeChange={onThemeChange}
        theme={theme}
      />
    ) : (
      <ThemeSegmentedControl
        disabled={disabled}
        onThemeChange={onThemeChange}
        theme={theme}
      />
    )}
  </AppearanceSettingsCard>
);

/**
 * Connects a debug Appearance treatment to the shared next-themes state.
 *
 * @param props - The visual treatment requested by the debug route.
 * @param props.treatment - Selects the radio list or segmented switcher.
 * @returns Theme settings synchronized with persistence and the global
 *   shortcut.
 */
const ThemeSettingsBoundary = ({ treatment }: ThemeSettingsBoundaryProps) => {
  const hydrated = useHydrated();
  const { setTheme, theme } = useTheme();
  const currentTheme = hydrated && isThemePreference(theme) ? theme : "";

  return (
    <ThemeSettings
      disabled={!hydrated || currentTheme === ""}
      onThemeChange={setTheme}
      theme={currentTheme}
      treatment={treatment}
    />
  );
};

export { ThemeSettingsBoundary };
