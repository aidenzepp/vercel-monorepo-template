import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { requireSession } from "@/lib/auth/session-server";

export default async function SettingsPage() {
  const session = await requireSession();

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

      <ProfileSettingsForm
        initialImage={
          session.user.image === null || session.user.image === undefined
            ? null
            : "/api/avatar"
        }
        initialName={session.user.name}
        initialUsername={session.user.username ?? null}
        isAnonymous={session.user.isAnonymous === true}
        userId={session.user.id}
      />
    </div>
  );
}
