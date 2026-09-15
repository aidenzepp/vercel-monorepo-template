import { notFound } from "next/navigation";

import { NotificationDebug } from "@/components/debug/notification-debug";
import { AppearanceSettingsBoundary } from "@/components/settings/appearance-settings";

/**
 * Displays the development-only toast preview surface.
 *
 * @returns The application's theme control and representative toast controls.
 */
export default function NotificationDebugPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-8 px-6 py-12 sm:py-16">
      <header className="flex max-w-2xl flex-col gap-3">
        <span className="text-primary text-xs font-semibold tracking-widest uppercase">
          Development only
        </span>
        <h1 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
          Toast lab
        </h1>
        <p className="text-muted-foreground text-sm leading-6 sm:text-base">
          Exercise the shared Base UI toast renderer and inspect its layout in
          both application themes.
        </p>
      </header>

      <AppearanceSettingsBoundary />
      <NotificationDebug />
    </main>
  );
}
