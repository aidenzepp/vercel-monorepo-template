"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import type { ReactNode } from "react";

interface SignInMethodButtonProps {
  children: ReactNode;
  lastUsedLoginMethod: string | null;
  loading: boolean;
  method: string;
}

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

export { SignInMethodButton };
