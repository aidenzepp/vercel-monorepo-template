import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { requireSession } from "@/lib/auth/session-server";

/** Loads the authenticated profile fields required by the settings form. */
const ProfileSettings = async () => {
  const { user } = await requireSession();

  return (
    <ProfileSettingsForm user={{ name: user.name, username: user.username }} />
  );
};

export { ProfileSettings };
