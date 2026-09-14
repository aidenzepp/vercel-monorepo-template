import { ProfileSettingsFormBoundary } from "@/components/settings/profile-settings-form";
import { SoundSettingsBoundary } from "@/components/settings/sound-settings";

/**
 * Displays the stable heading for application settings.
 *
 * @returns The settings title and purpose.
 */
const SettingsHeader = () => (
  <header className="flex flex-col gap-1">
    <h1 className="font-heading text-3xl font-semibold tracking-tight">
      Settings
    </h1>
    <p className="text-muted-foreground text-sm">
      Manage your profile and preferences.
    </p>
  </header>
);

/**
 * Displays profile and browser sound preferences inside the protected layout.
 *
 * @returns The settings page with profile and sound controls.
 */
export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-8">
      <SettingsHeader />
      <ProfileSettingsFormBoundary />
      <SoundSettingsBoundary />
    </div>
  );
}
