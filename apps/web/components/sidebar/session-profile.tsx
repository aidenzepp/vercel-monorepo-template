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
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { FieldError } from "@workspace/ui/components/field";
import { result } from "@workspace/utils/result";
import { HatGlasses, LogOut, Settings, UserRound } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useActionState } from "react";

import { useSession } from "@/components/auth/session-provider";
import { authClient } from "@/lib/auth/auth-client";

const signOut = async (): Promise<string | null> => {
  const response = await result.trycatch(
    async () => await authClient.signOut()
  );

  if (!response.ok || response.value.error) {
    return "Sign out failed. Try again.";
  }

  window.location.assign("/sign-in");
  return null;
};

const SessionProfile = () => {
  const { user } = useSession();
  const [errorMessage, action, pending] = useActionState(signOut, null);
  const name = user.isAnonymous === true ? "Temporary user" : user.name;

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring flex w-full min-w-0 items-center gap-3 rounded-xl p-2 text-left outline-none focus-visible:ring-2"
          title="Open account menu"
        >
          <Avatar size="lg">
            {user.image === null || user.image === undefined ? null : (
              <AvatarImage key={user.image} alt="" src={user.image} />
            )}
            <AvatarFallback>
              {user.isAnonymous === true ? (
                <HatGlasses aria-hidden="true" />
              ) : (
                <UserRound aria-hidden="true" />
              )}
            </AvatarFallback>
          </Avatar>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="text-muted-foreground block truncate text-xs">
              {user.isAnonymous === true ? "Anonymous session" : user.email}
            </span>
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" side="top">
          <DropdownMenuItem render={<Link href="/settings" />}>
            <Settings aria-hidden="true" />
            Settings
          </DropdownMenuItem>
          <Form action={action}>
            <DropdownMenuItem
              disabled={pending}
              nativeButton
              render={<button className="w-full" type="submit" />}
              variant="destructive"
            >
              <LogOut aria-hidden="true" />
              {pending ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </Form>
        </DropdownMenuContent>
      </DropdownMenu>

      {errorMessage === null ? null : (
        <FieldError className="px-2">{errorMessage}</FieldError>
      )}
    </div>
  );
};

export { SessionProfile };
