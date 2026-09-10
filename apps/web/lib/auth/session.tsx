"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useEffect } from "react";

import { authClient } from "@/lib/auth/auth-client";

type Session = typeof authClient.$Infer.Session;

const SessionContext = createContext<Session | undefined>(undefined);

/**
 * Seeds Better Auth's client store from the server-validated session and keeps
 * protected client components synchronized with subsequent session updates.
 */
const SessionProvider = ({
  children,
  initialSession,
}: Readonly<{
  children: React.ReactNode;
  initialSession: Session;
}>) => {
  const router = useRouter();

  authClient.hydrateSession(initialSession);

  const { data, error, isPending } = authClient.useSession();
  const session = data ?? initialSession;

  useEffect(() => {
    if (!(isPending || error) && data === null) {
      router.replace("/sign-in");
      router.refresh();
    }
  }, [data, error, isPending, router]);

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
};

/**
 * Returns the current non-null session inside the protected application shell.
 */
const useSession = (): Session => {
  const session = use(SessionContext);

  if (session === undefined) {
    throw new Error(
      "AUTH_SESSION_PROVIDER_MISSING: useSession must be called inside SessionProvider."
    );
  }

  return session;
};

export { SessionProvider, useSession };
export type { Session };
