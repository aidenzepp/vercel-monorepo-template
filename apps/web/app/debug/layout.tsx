/**
 * Displays the stable heading shared by temporary Settings prototypes.
 *
 * @returns The production-shaped Settings title and purpose.
 */
const DebugSettingsHeader = () => (
  <header className="flex flex-col gap-1">
    <h1 className="font-heading text-3xl font-semibold tracking-tight">
      Settings
    </h1>
    <p className="text-muted-foreground text-sm">
      Manage your profile and preferences.
    </p>
  </header>
);

/**
 * Places public theme prototypes in the same content shell as Settings.
 *
 * @param props - The active public debug route.
 * @param props.children - Supplies one Appearance card treatment.
 * @returns A public, production-shaped Settings preview shell.
 */
export default function DebugSettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-svh px-4">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-8">
        <DebugSettingsHeader />
        {children}
      </div>
    </main>
  );
}
