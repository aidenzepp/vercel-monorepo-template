"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { FieldError } from "@workspace/ui/components/field";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import { Spinner } from "@workspace/ui/components/spinner";
import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";
import { HatGlasses, LogOut, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useSession } from "@/components/auth/session-provider";
import type { Session } from "@/components/auth/session-provider";
import { authClient } from "@/lib/auth/auth-client";

/**
 * The session-backed identity required by the sidebar account menu.
 */
type UserMenuUser = Pick<
  Session["user"],
  "id" | "image" | "isAnonymous" | "name" | "username"
>;

interface UserMenuAvatarProps {
  image: UserMenuUser["image"];
  isAnonymous: boolean;
}

interface UserMenuIdentityProps {
  isAnonymous: boolean;
  name: UserMenuUser["name"];
  username: UserMenuUser["username"];
}

interface UserMenuTriggerProps {
  user: UserMenuUser;
}

interface SignOutMenuItemProps {
  onSignOut: () => Promise<string | null>;
}

interface UserMenuContentProps {
  onSignOut: SignOutMenuItemProps["onSignOut"];
}

interface SidebarUserMenuProps extends UserMenuContentProps {
  user: UserMenuUser;
}

/**
 * Requests Better Auth session termination for the current user.
 *
 * @param userId - Identifies the session owner in operational logs.
 * @returns A repair message when sign-out fails, or `null` after success.
 * @see https://better-auth.com/docs/concepts/session-management#sign-out
 */
const requestSignOut = async (userId: string): Promise<string | null> => {
  const response = await result.trycatch(
    async () => await authClient.signOut()
  );

  if (!response.ok) {
    logger.error(
      {
        err: response.error,
        operation: "auth.sign_out.request",
        userId,
      },
      "Sign-out request failed before Better Auth responded"
    );
    return "We couldn’t sign you out. Try again.";
  }

  if (response.value.error) {
    logger.warn(
      {
        code: response.value.error.code,
        operation: "auth.sign_out.response",
        status: response.value.error.status,
        userId,
      },
      "Better Auth rejected the sign-out request"
    );
    return "We couldn’t sign you out. Try again.";
  }

  return null;
};

/**
 * Displays the avatar treatment for a regular or temporary user.
 *
 * @param props - The stored image and account kind.
 * @param props.image - Supplies the regular user's optional profile image.
 * @param props.isAnonymous - Selects the fixed temporary-user fallback.
 * @returns The account avatar used by the sidebar menu trigger.
 */
const UserMenuAvatar = ({ image, isAnonymous }: UserMenuAvatarProps) => (
  <Avatar>
    {isAnonymous || image === null || image === undefined ? null : (
      <AvatarImage key={image} alt="" src={image} />
    )}
    <AvatarFallback>
      {isAnonymous ? (
        <HatGlasses aria-hidden="true" />
      ) : (
        <UserRound aria-hidden="true" />
      )}
    </AvatarFallback>
  </Avatar>
);

/**
 * Displays the account identity summarized by the sidebar menu trigger.
 *
 * @param props - The public identity and account kind.
 * @param props.isAnonymous - Selects temporary-account copy instead of public
 *   identity.
 * @param props.name - Supplies the regular user's display name.
 * @param props.username - Supplies the regular user's optional username.
 * @returns The two-line identity label for the account menu.
 */
const UserMenuIdentity = ({
  isAnonymous,
  name,
  username,
}: UserMenuIdentityProps) => {
  let description =
    username === null || username === undefined
      ? "Username not set"
      : `@${username}`;

  if (isAnonymous) {
    description = "Anonymous session";
  }

  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium">
        {isAnonymous ? "Temporary user" : name}
      </span>
      <span className="text-muted-foreground block truncate text-xs">
        {description}
      </span>
    </span>
  );
};

/**
 * Composes the Shadcn menu trigger from the current user's identity.
 *
 * @param props - The user summarized by the trigger.
 * @param props.user - Supplies the account kind, avatar, name, and username.
 * @returns The sidebar button that opens account actions.
 */
const UserMenuTrigger = ({ user }: UserMenuTriggerProps) => (
  <DropdownMenuTrigger
    render={<SidebarMenuButton data-cuelume-toggle="press" size="lg" />}
  >
    <UserMenuAvatar
      image={user.image}
      isAnonymous={user.isAnonymous === true}
    />
    <UserMenuIdentity
      isAnonymous={user.isAnonymous === true}
      name={user.name}
      username={user.username}
    />
  </DropdownMenuTrigger>
);

/**
 * Navigates from the account menu to profile settings.
 *
 * @returns The settings navigation item.
 */
const SettingsMenuItem = () => (
  <DropdownMenuItem
    render={<Link data-cuelume-toggle="press" href="/settings" />}
  >
    <Settings aria-hidden="true" />
    Settings
  </DropdownMenuItem>
);

/**
 * Displays a recoverable sign-out failure beside the owning menu action.
 *
 * @param props - The latest sign-out result.
 * @param props.message - Supplies repair guidance after a failed request.
 * @returns The sign-out error, or no content when the action is clear.
 */
const SignOutMenuError = ({ message }: { message: string | null }) =>
  message === null ? null : (
    <FieldError className="px-2 py-1">{message}</FieldError>
  );

/**
 * Owns sign-out progress and failure presentation for the account menu.
 *
 * @param props - The sign-out capability supplied by the application boundary.
 * @param props.onSignOut - Ends the current session and reports a repairable
 *   failure.
 * @returns The destructive menu action and its localized error state.
 */
const SignOutMenuItem = ({ onSignOut }: SignOutMenuItemProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /**
   * Runs sign-out as a transition so the menu item owns its pending state.
   */
  const signOut = () => {
    setErrorMessage(null);
    startTransition(async () => {
      setErrorMessage(await onSignOut());
    });
  };

  return (
    <>
      <DropdownMenuItem
        aria-busy={pending || undefined}
        closeOnClick={false}
        data-cuelume-toggle="press"
        disabled={pending}
        onClick={signOut}
        variant="destructive"
      >
        {pending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <LogOut aria-hidden="true" />
        )}
        {pending ? "Signing out…" : "Sign out"}
      </DropdownMenuItem>
      <SignOutMenuError message={errorMessage} />
    </>
  );
};

/**
 * Displays the standard account actions inside the Shadcn menu content.
 *
 * @param props - The account capabilities available to menu items.
 * @param props.onSignOut - Ends the current session and reports a repairable
 *   failure.
 * @returns The settings and sign-out menu items.
 */
const UserMenuContent = ({ onSignOut }: UserMenuContentProps) => (
  <DropdownMenuContent align="start" side="top">
    <SettingsMenuItem />
    <DropdownMenuSeparator />
    <SignOutMenuItem onSignOut={onSignOut} />
  </DropdownMenuContent>
);

/**
 * Composes a prop-driven sidebar account menu.
 *
 * @param props - The current user and account capabilities.
 * @param props.onSignOut - Ends the current session and reports a repairable
 *   failure.
 * @param props.user - Supplies the public identity shown by the trigger.
 * @returns The complete sidebar account menu.
 */
const SidebarUserMenu = ({ onSignOut, user }: SidebarUserMenuProps) => (
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <UserMenuTrigger user={user} />
        <UserMenuContent onSignOut={onSignOut} />
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
);

/**
 * Connects the prop-driven sidebar menu to session and navigation services.
 *
 * @returns The account menu for the current protected-session user.
 */
const SidebarUserMenuBoundary = () => {
  const { user } = useSession();
  const router = useRouter();

  /**
   * Ends the current session and transfers successful requests to sign-in.
   *
   * @returns A repair message when the current session remains active.
   */
  const signOut = async (): Promise<string | null> => {
    const errorMessage = await requestSignOut(user.id);

    if (errorMessage === null) {
      router.replace("/sign-in");
    }

    return errorMessage;
  };

  return <SidebarUserMenu onSignOut={signOut} user={user} />;
};

export {
  SidebarUserMenu,
  SidebarUserMenuBoundary,
  UserMenuAvatar,
  UserMenuIdentity,
};
