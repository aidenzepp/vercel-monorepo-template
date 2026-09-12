"use client";

import { Button } from "@workspace/ui/components/button";
import { Field, FieldError } from "@workspace/ui/components/field";
import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { authClient } from "@/lib/auth/auth-client";

interface AnonymousSignInFormProps {
  onSignIn: () => Promise<string | null>;
}

/**
 * Creates a real Better Auth anonymous user and session.
 *
 * @returns A repair message when the temporary session cannot be created, or
 *   `null` after success.
 * @see https://better-auth.com/docs/plugins/anonymous
 */
const createAnonymousSession = async (): Promise<string | null> => {
  const response = await result.trycatch(
    async () => await authClient.signIn.anonymous()
  );

  if (!response.ok) {
    logger.error(
      {
        err: response.error,
        operation: "auth.sign_in.anonymous.request",
      },
      "Anonymous sign-in request failed before Better Auth responded"
    );
    return "A temporary account couldn’t be created. Try again.";
  }

  if (response.value.error) {
    logger.warn(
      {
        code: response.value.error.code,
        operation: "auth.sign_in.anonymous.response",
        status: response.value.error.status,
      },
      "Better Auth rejected the anonymous sign-in request"
    );
    return "A temporary account couldn’t be created. Try again.";
  }

  return null;
};

/**
 * Displays a recoverable temporary-account creation failure.
 *
 * @param props - The latest anonymous sign-in result.
 * @param props.message - Supplies repair guidance after a failed request.
 * @returns The sign-in error, or no content when the action is clear.
 */
const AnonymousSignInError = ({ message }: { message: string | null }) =>
  message === null ? null : <FieldError>{message}</FieldError>;

/**
 * Displays anonymous sign-in progress on the form's primary action.
 *
 * @param props - The current form submission state.
 * @param props.pending - Disables repeated submission while Better Auth
 *   responds.
 * @returns The temporary-account submission button.
 */
const AnonymousSignInAction = ({ pending }: { pending: boolean }) => (
  <Button className="w-full" loading={pending} size="lg" type="submit">
    {pending ? "Creating account…" : "Continue temporarily"}
  </Button>
);

/**
 * Displays temporary-account creation with localized progress and failure.
 *
 * @param props - The anonymous authentication capability.
 * @param props.onSignIn - Creates the temporary session and reports a
 *   repairable failure.
 * @returns The anonymous sign-in form.
 */
const AnonymousSignInForm = ({ onSignIn }: AnonymousSignInFormProps) => {
  const [errorMessage, action, pending] = useActionState(
    async () => await onSignIn(),
    null
  );

  return (
    <Field>
      <Form action={action}>
        <AnonymousSignInAction pending={pending} />
      </Form>
      <AnonymousSignInError message={errorMessage} />
    </Field>
  );
};

/**
 * Connects the prop-driven anonymous form to Better Auth and navigation.
 *
 * @returns The temporary-account form for the public sign-in surface.
 */
const AnonymousSignInFormBoundary = () => {
  const router = useRouter();

  /**
   * Creates the session and transfers successful requests into the application.
   *
   * @returns A repair message when no authenticated session was created.
   */
  const signIn = async (): Promise<string | null> => {
    const errorMessage = await createAnonymousSession();

    if (errorMessage === null) {
      router.replace("/");
    }

    return errorMessage;
  };

  return <AnonymousSignInForm onSignIn={signIn} />;
};

export { AnonymousSignInForm, AnonymousSignInFormBoundary };
