import { ThemeSettingsBoundary } from "@/components/debug/theme-settings";

/**
 * Displays the public compact segmented theme prototype.
 *
 * @returns The segmented Appearance card outside authenticated routes.
 */
export default function ThemeSegmentedDebugPage() {
  return <ThemeSettingsBoundary treatment="segmented" />;
}
