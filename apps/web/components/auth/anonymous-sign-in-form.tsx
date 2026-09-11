"use client";

import { Button } from "@workspace/ui/components/button";
import { Field, FieldError } from "@workspace/ui/components/field";
import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { authClient } from "@/lib/auth/auth-client";

/** Creates a real Better Auth anonymous user and session. */
const createAnonymousSession = async (): Promise<string | null> => {
  const response = await result.trycatch(
    async () => await authClient.signIn.anonymous()
  );

  if (!response.ok) {
    logger.error(
      { err: response.error, operation: "auth.sign_in.anonymous" },
      "Anonymous sign-in request failed"
    );
    return "A temporary account couldn’t be created. Try again.";
  }

  if (response.value.error) {
    logger.warn(
      {
        code: response.value.error.code,
        operation: "auth.sign_in.anonymous",
        status: response.value.error.status,
      },
      "Anonymous sign-in rejected"
    );
    return "A temporary account couldn’t be created. Try again.";
  }

  return null;
};

const AnonymousSignInForm = () => {
  const router = useRouter();
  const signInAnonymously = async (): Promise<string | null> => {
    const errorMessage = await createAnonymousSession();

    if (errorMessage === null) {
      router.replace("/");
    }

    return errorMessage;
  };
  const [errorMessage, action, pending] = useActionState(
    signInAnonymously,
    null
  );

  return (
    <Field>
      <Form action={action}>
        <Button className="w-full" loading={pending} size="lg" type="submit">
          {pending ? "Creating account…" : "Continue temporarily"}
        </Button>
      </Form>
      {errorMessage === null ? null : <FieldError>{errorMessage}</FieldError>}
    </Field>
  );
};

export { AnonymousSignInForm };
