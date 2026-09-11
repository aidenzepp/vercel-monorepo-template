"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
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
import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";
import { HatGlasses, LogOut, Settings, UserRound } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useActionState, useId } from "react";

import { useSession } from "@/components/auth/session-provider";
import type { Session } from "@/components/auth/session-provider";
import { authClient } from "@/lib/auth/auth-client";

interface SessionProfilePreviewProps {
  avatar: Session["user"]["image"];
  name: Session["user"]["name"];
  username: Session["user"]["username"];
}

/** Displays the public identity of a signed-in user. */
const SessionProfilePreview = ({
  avatar,
  name,
  username,
}: SessionProfilePreviewProps) => (
  <>
    <Avatar>
      {avatar === null || avatar === undefined ? null : (
        <AvatarImage key={avatar} alt="" src={avatar} />
      )}
      <AvatarFallback>
        <UserRound aria-hidden="true" />
      </AvatarFallback>
    </Avatar>

    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium">{name}</span>
      <span className="text-muted-foreground block truncate text-xs">
        {username === null || username === undefined
          ? "Username not set"
          : `@${username}`}
      </span>
    </span>
  </>
);

/** Displays the fixed identity used for an anonymous session. */
const AnonymousProfilePreview = () => (
  <>
    <Avatar>
      <AvatarFallback>
        <HatGlasses aria-hidden="true" />
      </AvatarFallback>
    </Avatar>

    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium">Temporary user</span>
      <span className="text-muted-foreground block truncate text-xs">
        Anonymous session
      </span>
    </span>
  </>
);

const signOut = async (): Promise<string | null> => {
  const response = await result.trycatch(
    async () => await authClient.signOut()
  );

  if (!response.ok) {
    logger.error(
      { err: response.error, operation: "auth.sign_out" },
      "Sign-out request failed"
    );
    return "We couldn’t sign you out. Try again.";
  }

  if (response.value.error) {
    logger.warn(
      {
        code: response.value.error.code,
        operation: "auth.sign_out",
        status: response.value.error.status,
      },
      "Sign-out rejected"
    );
    return "We couldn’t sign you out. Try again.";
  }

  window.location.assign("/sign-in");
  return null;
};

/** Owns the profile menu actions and sign-out feedback. */
const SessionProfileOptions = () => {
  const [errorMessage, action, pending] = useActionState(signOut, null);
  const formId = useId();

  return (
    <>
      <Form action={action} id={formId}>
        <DropdownMenuContent align="start" side="top">
          <DropdownMenuItem render={<Link href="/settings" />}>
            <Settings aria-hidden="true" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            closeOnClick={false}
            disabled={pending}
            nativeButton
            render={
              <Button
                className="w-full justify-start"
                color="destructive"
                form={formId}
                loading={pending}
                size="sm"
                type="submit"
                variant="ghost"
              />
            }
            variant="destructive"
          >
            {pending ? null : (
              <LogOut aria-hidden="true" data-icon="inline-start" />
            )}
            {pending ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </Form>

      {errorMessage === null ? null : (
        <FieldError className="px-2">{errorMessage}</FieldError>
      )}
    </>
  );
};

/** Chooses the session preview and composes its account menu. */
const SessionProfile = () => {
  const { user } = useSession();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            {user.isAnonymous === true ? (
              <AnonymousProfilePreview />
            ) : (
              <SessionProfilePreview
                avatar={user.image}
                name={user.name}
                username={user.username}
              />
            )}
          </DropdownMenuTrigger>

          <SessionProfileOptions />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export {
  AnonymousProfilePreview,
  SessionProfile,
  SessionProfileOptions,
  SessionProfilePreview,
};
