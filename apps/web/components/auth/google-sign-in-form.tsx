"use client";

import { Field, FieldError } from "@workspace/ui/components/field";
import { GoogleLogo } from "@workspace/ui/logos/google";
import Form from "next/form";
import { useActionState } from "react";

import { SignInMethodButton } from "@/components/auth/sign-in-method-button";
import { authClient } from "@/lib/auth/auth-client";
import { requestGoogleSignIn } from "@/lib/auth/google-sign-in";

interface GoogleSignInFormProps {
  lastUsedLoginMethod: string | null;
  onSignIn: () => Promise<string | null>;
  redirectErrorMessage: string | null;
}

interface GoogleSignInFormBoundaryProps {
  lastUsedLoginMethod: string | null;
  redirectErrorMessage: string | null;
}

interface GoogleSignInActionProps {
  lastUsedLoginMethod: string | null;
  pending: boolean;
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
 * @param props - The remembered method and current Google submission state.
 * @param props.lastUsedLoginMethod - Supplies the method remembered for this
 *   device.
 * @param props.pending - Disables repeated submission while OAuth starts.
 * @returns The Google sign-in submission button.
 */
const GoogleSignInAction = ({
  lastUsedLoginMethod,
  pending,
}: GoogleSignInActionProps) => (
  <SignInMethodButton
    lastUsedLoginMethod={lastUsedLoginMethod}
    loading={pending}
    method="google"
  >
    <GoogleLogo className="size-4" />
    {pending ? "Opening Google…" : "Continue with Google"}
  </SignInMethodButton>
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
 * @param props.lastUsedLoginMethod - Supplies the method remembered for this
 *   device.
 * @param props.onSignIn - Starts the provider redirect and resolves to `null`
 *   after it begins or to a recoverable failure message when it cannot begin.
 * @param props.redirectErrorMessage - Reports a prior callback failure.
 * @returns The Google sign-in form.
 */
const GoogleSignInForm = ({
  lastUsedLoginMethod,
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
        <GoogleSignInAction
          lastUsedLoginMethod={lastUsedLoginMethod}
          pending={pending}
        />
      </Form>
      <GoogleSignInError message={errorMessage} />
    </Field>
  );
};

/**
 * Connects the prop-driven Google form to the Better Auth browser client.
 *
 * @param props - The server-provided device and callback state.
 * @param props.lastUsedLoginMethod - Supplies the method remembered for this
 *   device.
 * @param props.redirectErrorMessage - Reports a prior callback failure.
 * @returns The production Google sign-in form.
 */
const GoogleSignInFormBoundary = ({
  lastUsedLoginMethod,
  redirectErrorMessage,
}: GoogleSignInFormBoundaryProps) => (
  <GoogleSignInForm
    lastUsedLoginMethod={lastUsedLoginMethod}
    onSignIn={signInWithGoogle}
    redirectErrorMessage={redirectErrorMessage}
  />
);

export { GoogleSignInForm, GoogleSignInFormBoundary };
