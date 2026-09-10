"use client";

import { Button } from "@workspace/ui/components/button";
import { Field, FieldError } from "@workspace/ui/components/field";
import { Spinner } from "@workspace/ui/components/spinner";
import { result } from "@workspace/utils/result";
import Form from "next/form";
import { useActionState } from "react";

import { authClient } from "@/lib/auth/auth-client";

/**
 * Creates a real Better Auth anonymous user and enters the protected app.
 */
const signInAnonymously = async (): Promise<string | null> => {
  const response = await result.trycatch(
    async () => await authClient.signIn.anonymous()
  );

  if (!response.ok || response.value.error) {
    return "A temporary account couldn’t be created. Try again.";
  }

  window.location.assign("/");
  return null;
};

const AnonymousSignInForm = () => {
  const [errorMessage, action, pending] = useActionState(
    signInAnonymously,
    null
  );

  return (
    <Field>
      <Form action={action}>
        <Button className="w-full" disabled={pending} size="lg" type="submit">
          {pending ? <Spinner /> : null}
          {pending ? "Creating account…" : "Continue temporarily"}
        </Button>
      </Form>
      {errorMessage === null ? null : <FieldError>{errorMessage}</FieldError>}
    </Field>
  );
};

export { AnonymousSignInForm };
