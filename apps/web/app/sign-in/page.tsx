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
    <main className="flex min-h-svh flex-col gap-4 p-6 md:p-10">
      <div className="flex justify-center md:justify-start">
        <Link aria-label="templ8 home" href="/">
          <Templ8Wordmark aria-hidden="true" className="h-8 w-auto" />
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center pb-16">
        <div className="w-full max-w-xs">
          <SignInForm />
        </div>
      </div>
    </main>
  );
}
