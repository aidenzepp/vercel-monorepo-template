import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile and account.
        </p>
      </header>

      <ProfileSettingsForm />
    </div>
  );
}
