"use client";

import { Button } from "@workspace/ui/components/button";
import { Field, FieldError } from "@workspace/ui/components/field";
import { GoogleLogo } from "@workspace/ui/logos/google";
import Form from "next/form";
import { useActionState } from "react";

import { authClient } from "@/lib/auth/auth-client";
import { requestGoogleSignIn } from "@/lib/auth/google-sign-in";

interface GoogleSignInFormProps {
  onSignIn: () => Promise<string | null>;
  redirectErrorMessage: string | null;
}

interface GoogleSignInFormBoundaryProps {
  redirectErrorMessage: string | null;
}

/**
 * Starts the fixed Google OAuth redirect through Better Auth.
 *
 * @returns A recoverable failure message, or `null` after OAuth starts.
 */
const signInWithGoogle = async (): Promise<string | null> =>
  await requestGoogleSignIn(
    async (options) => await authClient.signIn.social(options)
  );

/**
 * Displays Google sign-in progress on the form action.
 *
 * @param props - The current Google submission state.
 * @param props.pending - Disables repeated submission while OAuth starts.
 * @returns The Google sign-in submission button.
 */
const GoogleSignInAction = ({ pending }: { pending: boolean }) => (
  <Button
    className="w-full"
    color="neutral"
    loading={pending}
    size="lg"
    type="submit"
    variant="outline"
  >
    <GoogleLogo className="size-4" />
    {pending ? "Opening Google…" : "Continue with Google"}
  </Button>
);

/**
 * Displays the Google sign-in failure associated with the current action.
 *
 * @param props - The latest Google sign-in result.
 * @param props.message - Supplies callback or request repair guidance.
 * @returns The failure alert, or no content when Google sign-in is clear.
 */
const GoogleSignInError = ({ message }: { message: string | null }) =>
  message === null ? null : <FieldError>{message}</FieldError>;

/**
 * Displays Google authentication with localized progress and failure copy.
 *
 * @param props - The Google authentication capability and callback state.
 * @param props.onSignIn - Starts the provider redirect and resolves to `null`
 *   after it begins or to a recoverable failure message when it cannot begin.
 * @param props.redirectErrorMessage - Reports a prior callback failure.
 * @returns The Google sign-in form.
 */
const GoogleSignInForm = ({
  onSignIn,
  redirectErrorMessage,
}: GoogleSignInFormProps) => {
  const [actionErrorMessage, action, pending] = useActionState(
    async () => await onSignIn(),
    null
  );
  const errorMessage = actionErrorMessage ?? redirectErrorMessage;

  return (
    <Field>
      <Form action={action}>
        <GoogleSignInAction pending={pending} />
      </Form>
      <GoogleSignInError message={errorMessage} />
    </Field>
  );
};

/**
 * Connects the prop-driven Google form to the Better Auth browser client.
 *
 * @param props - The server-validated callback state.
 * @param props.redirectErrorMessage - Reports a prior callback failure.
 * @returns The production Google sign-in form.
 */
const GoogleSignInFormBoundary = ({
  redirectErrorMessage,
}: GoogleSignInFormBoundaryProps) => (
  <GoogleSignInForm
    onSignIn={signInWithGoogle}
    redirectErrorMessage={redirectErrorMessage}
  />
);

export { GoogleSignInForm, GoogleSignInFormBoundary };
