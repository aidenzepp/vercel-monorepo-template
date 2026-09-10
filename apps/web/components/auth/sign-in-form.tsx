import { Button } from "@workspace/ui/components/button";
import { FieldGroup, FieldSeparator } from "@workspace/ui/components/field";
import { GoogleLogo } from "@workspace/ui/logos/google";

import { AnonymousSignInForm } from "@/components/auth/anonymous-sign-in-form";

const SignInForm = () => (
  <FieldGroup>
    <div className="flex flex-col items-center gap-1 text-center">
      <h1 className="text-2xl font-bold">Sign in to templ8</h1>
      <p className="text-muted-foreground text-sm text-balance">
        Choose how you&apos;d like to continue.
      </p>
    </div>

    <AnonymousSignInForm />

    <FieldSeparator>Or continue with</FieldSeparator>

    <Button
      className="w-full"
      disabled
      size="lg"
      title="Google sign-in is not configured"
      variant="outline"
    >
      <GoogleLogo className="size-4" />
      Continue with Google
    </Button>
  </FieldGroup>
);

export { SignInForm };
