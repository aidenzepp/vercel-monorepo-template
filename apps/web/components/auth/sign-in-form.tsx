import { FieldGroup, FieldSeparator } from "@workspace/ui/components/field";

import { AnonymousSignInFormBoundary } from "@/components/auth/anonymous-sign-in-form";
import { GoogleSignInFormBoundary } from "@/components/auth/google-sign-in-form";

interface SignInFormProps {
  googleSignInErrorMessage: string | null;
}

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
 * Composes the authentication methods available on the sign-in page.
 *
 * @param props - The validated provider callback state.
 * @param props.googleSignInErrorMessage - Reports a prior Google failure.
 * @returns The sign-in heading, temporary-account flow, and Google flow.
 */
const SignInForm = ({ googleSignInErrorMessage }: SignInFormProps) => (
  <FieldGroup>
    <SignInHeader />
    <AnonymousSignInFormBoundary />
    <FieldSeparator>Or continue with</FieldSeparator>
    <GoogleSignInFormBoundary redirectErrorMessage={googleSignInErrorMessage} />
  </FieldGroup>
);

export { SignInForm };
