import { ProfileSettingsFormBoundary } from "@/components/settings/profile-settings-form";

/**
 * Displays the stable heading for account settings.
 *
 * @returns The settings title and purpose.
 */
const SettingsHeader = () => (
  <header className="flex flex-col gap-1">
    <h1 className="font-heading text-3xl font-semibold tracking-tight">
      Settings
    </h1>
    <p className="text-muted-foreground text-sm">
      Manage your profile and account.
    </p>
  </header>
);

/**
 * Displays account settings from the session already owned by the protected
 * layout.
 *
 * @returns The settings page with its profile form.
 */
export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-8">
      <SettingsHeader />
      <ProfileSettingsFormBoundary />
    </div>
  );
}
