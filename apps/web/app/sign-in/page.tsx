import { lastLoginMethodOptions } from "@workspace/better-auth/config/last-login-method";
import { Templ8Wordmark } from "@workspace/ui/logos/templ8";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { getGoogleSignInErrorMessage } from "@/lib/auth/google-sign-in-error";
import { getSession } from "@/lib/auth/session-server";

interface SignInPageProps {
  searchParams: Promise<{
    error?: string | string[];
    provider?: string | string[];
  }>;
}

interface SignInPanelProps {
  googleSignInErrorMessage: string | null;
  lastUsedLoginMethod: string | null;
}

/**
 * Displays the centered home link above the sign-in form.
 *
 * @returns The theme-aware templ8 wordmark link.
 */
const SignInBrand = () => (
  <div className="flex justify-center">
    <Link aria-label="templ8 home" href="/">
      <Templ8Wordmark aria-hidden="true" className="h-8 w-auto" />
    </Link>
  </div>
);

/**
 * Displays the sign-in controls within the narrow authentication column.
 *
 * @param props - The request-scoped device and provider callback state.
 * @param props.googleSignInErrorMessage - Reports a prior Google failure.
 * @param props.lastUsedLoginMethod - Supplies Better Auth's remembered method
 *   for this device.
 * @returns The branded sign-in panel.
 */
const SignInPanel = ({
  googleSignInErrorMessage,
  lastUsedLoginMethod,
}: SignInPanelProps) => (
  <section className="flex min-h-svh flex-col gap-4 px-6 py-10 md:px-10">
    <SignInBrand />
    <div className="flex flex-1 items-center justify-center py-12">
      <div className="w-full max-w-xs">
        <SignInForm
          googleSignInErrorMessage={googleSignInErrorMessage}
          lastUsedLoginMethod={lastUsedLoginMethod}
        />
      </div>
    </div>
  </section>
);

/**
 * Displays a decorative grid beside sign-in on large viewports.
 *
 * @returns The non-interactive sign-in artwork region.
 */
const SignInArtwork = () => (
  <div
    aria-hidden="true"
    className="bg-muted hidden border-s bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:2rem_2rem] lg:block"
  />
);

/**
 * Redirects active sessions and displays authentication choices to visitors.
 *
 * @param props - The asynchronous App Router sign-in inputs.
 * @param props.searchParams - Supplies untrusted OAuth callback query values.
 * @returns The public sign-in page when no session exists.
 */
export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getSession();

  if (session !== null) {
    redirect("/");
  }

  const [cookieStore, resolvedSearchParams] = await Promise.all([
    cookies(),
    searchParams,
  ]);
  const googleSignInErrorMessage =
    getGoogleSignInErrorMessage(resolvedSearchParams);
  const lastUsedLoginMethod =
    cookieStore.get(lastLoginMethodOptions.cookieName)?.value ?? null;

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <SignInPanel
        googleSignInErrorMessage={googleSignInErrorMessage}
        lastUsedLoginMethod={lastUsedLoginMethod}
      />
      <SignInArtwork />
    </main>
  );
}
