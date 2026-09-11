import "server-only";
import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth/auth-server";

/**
 * Reads the current request's session once and shares it across Server
 * Components rendered for that request.
 */
const getSession = cache(async () => {
  const session = await result.trycatch(
    async () => await auth.api.getSession({ headers: await headers() })
  );

  if (!session.ok) {
    unstable_rethrow(session.error);
    logger.error(
      { err: session.error, operation: "auth.session.read" },
      "Session read failed"
    );
    throw session.error;
  }

  return session.value;
});

/**
 * Returns the authenticated session or transfers control to the sign-in page.
 *
 * Protected layouts call this once so their descendants receive a non-null
 * session instead of repeating nullable checks and redirects.
 */
const requireSession = async () => {
  const session = await getSession();

  if (session === null) {
    redirect("/sign-in");
  }

  return session;
};

export { getSession, requireSession };
