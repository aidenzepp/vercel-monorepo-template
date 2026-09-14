"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

import { authClient } from "@/lib/auth/auth-client";

interface SignInMethodButtonProps {
  children: ReactNode;
  lastUsedLoginMethod: string | null;
  loading: boolean;
  method: string;
}

interface SignInMethodButtonBoundaryProps {
  children: ReactNode;
  loading: boolean;
  method: string;
}

/**
 * Registers the navigation-backed login cookie as a stable external store.
 *
 * The cookie changes across authentication navigations, so this mounted page
 * does not need an in-place change notification.
 *
 * @returns A no-op cleanup callback for React's subscription contract.
 */
const subscribeToLastUsedLoginMethod = (): (() => void) => () => {
  // Authentication navigation changes the cookie before this tree remounts.
};

/**
 * Supplies a deterministic server snapshot before the browser cookie is read.
 *
 * @returns No remembered login method during server rendering.
 */
const getLastUsedLoginMethodServerSnapshot = (): null => null;

/**
 * Identifies the sign-in method most recently completed on this device.
 *
 * @returns The visual marker overlaid on the matching method action.
 */
const LastUsedSignInMethodBadge = () => (
  <Badge className="pointer-events-none absolute -top-1 -right-2 z-10">
    Last Used
  </Badge>
);

/**
 * Displays a consistently styled action for one external sign-in method.
 *
 * @param props - The method identity and current submission state.
 * @param props.children - Supplies the provider icon and action label.
 * @param props.lastUsedLoginMethod - Supplies Better Auth's remembered method
 *   for this device.
 * @param props.loading - Disables duplicate submission while sign-in starts.
 * @param props.method - Identifies this action using Better Auth's method ID.
 * @returns The submission button shared by external sign-in methods.
 * @see https://better-auth.com/docs/plugins/last-login-method#getting-the-last-used-method
 */
const SignInMethodButton = ({
  children,
  lastUsedLoginMethod,
  loading,
  method,
}: SignInMethodButtonProps) => (
  <div className="relative">
    <Button
      className="w-full"
      color="neutral"
      loading={loading}
      size="lg"
      type="submit"
      variant="outline"
    >
      {children}
    </Button>
    {lastUsedLoginMethod === method ? <LastUsedSignInMethodBadge /> : null}
  </div>
);

/**
 * Connects a sign-in method action to Better Auth's device-local history.
 *
 * @param props - The method identity and current submission state.
 * @param props.children - Supplies the provider icon and action label.
 * @param props.loading - Disables duplicate submission while sign-in starts.
 * @param props.method - Identifies the action using Better Auth's method ID.
 * @returns The method action with its current last-used status.
 * @see https://better-auth.com/docs/plugins/last-login-method#getting-the-last-used-method
 */
const SignInMethodButtonBoundary = ({
  children,
  loading,
  method,
}: SignInMethodButtonBoundaryProps) => {
  const lastUsedLoginMethod = useSyncExternalStore(
    subscribeToLastUsedLoginMethod,
    authClient.getLastUsedLoginMethod,
    getLastUsedLoginMethodServerSnapshot
  );

  return (
    <SignInMethodButton
      lastUsedLoginMethod={lastUsedLoginMethod}
      loading={loading}
      method={method}
    >
      {children}
    </SignInMethodButton>
  );
};

export { SignInMethodButton, SignInMethodButtonBoundary };
