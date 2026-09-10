"use client";

import { redirect } from "next/navigation";
import { createContext, useContext } from "react";

import { authClient } from "@/lib/auth/auth-client";

type Session = typeof authClient.$Infer.Session;

const SessionContext = createContext<Session | undefined>(undefined);

/**
 * Seeds Better Auth's client store from the server-validated session and keeps
 * protected client components synchronized with subsequent session updates.
 *
 * Better Auth accepts only the first non-null hydration, so calling it during
 * render is idempotent. A completed client read with no session redirects before
 * this provider can expose a nullable value.
 */
const SessionProvider = ({
  children,
  session,
}: Readonly<{
  children: React.ReactNode;
  session: Session;
}>) => {
  authClient.hydrateSession(session);

  const { data, isPending } = authClient.useSession();

  if (!isPending && data === null) {
    redirect("/sign-in");
  }

  return (
    <SessionContext.Provider value={data ?? session}>
      {children}
    </SessionContext.Provider>
  );
};

/**
 * Returns the current non-null session inside the protected application shell.
 */
const useSession = (): Session => {
  const session = useContext(SessionContext);

  if (session === undefined) {
    throw new Error(
      "AUTH_SESSION_PROVIDER_MISSING: useSession must be called inside SessionProvider."
    );
  }

  return session;
};

export { SessionProvider, useSession };
export type { Session };
