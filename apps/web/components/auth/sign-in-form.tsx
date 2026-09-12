import { Button } from "@workspace/ui/components/button";
import { FieldGroup, FieldSeparator } from "@workspace/ui/components/field";
import { GoogleLogo } from "@workspace/ui/logos/google";

import { AnonymousSignInFormBoundary } from "@/components/auth/anonymous-sign-in-form";

/**
 * Displays the purpose and available-method guidance for sign-in.
 *
 * @returns The sign-in heading and description.
 */
const SignInHeader = () => (
  <div className="flex flex-col items-center gap-1 text-center">
    <h1 className="text-2xl font-bold">Sign in to templ8</h1>
    <p className="text-muted-foreground text-sm text-balance">
      Choose how you&apos;d like to continue.
    </p>
  </div>
);

/**
 * Displays the unavailable Google authentication method without enabling it.
 *
 * @returns The disabled Google sign-in action.
 */
const GoogleSignInAction = () => (
  <Button
    className="w-full"
    color="neutral"
    disabled
    size="lg"
    title="Google sign-in is not configured"
    variant="outline"
  >
    <GoogleLogo className="size-4" />
    Continue with Google
  </Button>
);

/**
 * Composes the authentication methods available on the sign-in page.
 *
 * @returns The sign-in heading, temporary-account flow, and Google placeholder.
 */
const SignInForm = () => (
  <FieldGroup>
    <SignInHeader />
    <AnonymousSignInFormBoundary />
    <FieldSeparator>Or continue with</FieldSeparator>
    <GoogleSignInAction />
  </FieldGroup>
);

export { SignInForm };
