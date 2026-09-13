import { ThemeSettingsBoundary } from "@/components/debug/theme-settings";

/**
 * Displays the public conventional radio-list theme prototype.
 *
 * @returns The radio-list Appearance card outside authenticated routes.
 */
export default function ThemeRadioDebugPage() {
  return <ThemeSettingsBoundary treatment="radio" />;
}
