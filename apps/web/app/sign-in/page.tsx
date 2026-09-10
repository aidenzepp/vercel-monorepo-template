import { Templ8Wordmark } from "@workspace/ui/logos/templ8";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { getSession } from "@/lib/auth/session-server";

export default async function SignInPage() {
  const session = await getSession();

  if (session !== null) {
    redirect("/");
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <section className="flex min-h-svh flex-col gap-4 px-6 py-10 md:px-10">
        <div className="flex justify-center">
          <Link aria-label="templ8 home" href="/">
            <Templ8Wordmark aria-hidden="true" className="h-8 w-auto" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-xs">
            <SignInForm />
          </div>
        </div>
      </section>

      <div
        aria-hidden="true"
        className="bg-muted hidden border-s bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:2rem_2rem] lg:block"
      />
    </main>
  );
}
