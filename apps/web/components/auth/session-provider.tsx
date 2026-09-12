"use client";

import { redirect } from "next/navigation";
import { createContext, useContext } from "react";

import { authClient } from "@/lib/auth/auth-client";

/**
 * The non-null Better Auth session exposed inside the protected application.
 */
type Session = typeof authClient.$Infer.Session;

/**
 * Shares the latest protected session without exposing a nullable state.
 */
const SessionContext = createContext<Session | undefined>(undefined);

/**
 * Seeds Better Auth's client store from the server-validated session and keeps
 * protected client components synchronized with subsequent session updates.
 *
 * Better Auth accepts only the first non-null hydration, so calling it during
 * render is idempotent. A completed client read with no session redirects
 * before this provider can expose a nullable value.
 *
 * @param props - The protected subtree and its server-validated session.
 * @param props.children - Supplies the protected client components.
 * @param props.session - Seeds the client session store before descendants
 *   render.
 * @returns The protected subtree with a current non-null session.
 * @see https://better-auth.com/docs/concepts/session-management#client-side
 * @see https://nextjs.org/docs/app/api-reference/functions/redirect#client-component
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
 *
 * @returns The latest session shared by the nearest provider.
 * @throws {Error} When called outside a {@link SessionProvider}.
 */
const useSession = (): Session => {
  const session = useContext(SessionContext);

  if (session === undefined) {
    throw new Error("useSession must be called inside SessionProvider.");
  }

  return session;
};

export { SessionProvider, useSession };
export type { Session };
