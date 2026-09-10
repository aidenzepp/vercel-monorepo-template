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
import Form from "next/form";
import { useActionState } from "react";

import { authClient } from "@/lib/auth/auth-client";
import { useSession } from "@/lib/auth/session";

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
  const initials = name
    .split(/\s+/u)
    .map((part) => part.at(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring flex w-full min-w-0 items-center gap-3 rounded-xl p-2 text-left outline-none focus-visible:ring-2"
          title="Open account menu"
        >
          <Avatar size="lg">
            {user.image === null || user.image === undefined ? null : (
              <AvatarImage alt="" src={user.image} />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="text-muted-foreground block truncate text-xs">
              {user.isAnonymous === true ? "Anonymous session" : user.email}
            </span>
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" side="top">
          <Form action={action}>
            <DropdownMenuItem
              disabled={pending}
              nativeButton
              render={<button className="w-full" type="submit" />}
            >
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
