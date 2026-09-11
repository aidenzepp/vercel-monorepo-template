import { AsyncBoundary } from "@workspace/ui/next/async-boundary";

import { ProfileSettings } from "@/components/settings/profile-settings";
import {
  ProfileSettingsError,
  ProfileSettingsLoading,
} from "@/components/settings/profile-settings-fallback";

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

      <AsyncBoundary
        failure={<ProfileSettingsError />}
        loading={<ProfileSettingsLoading />}
      >
        <ProfileSettings />
      </AsyncBoundary>
    </div>
  );
}
