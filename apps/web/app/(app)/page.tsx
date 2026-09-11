import { Button } from "@workspace/ui/components/button";
import { Kbd } from "@workspace/ui/components/kbd";

/**
 * Displays the authenticated application's starter page.
 *
 * @returns The initial product workspace and its development shortcut.
 */
export default function Page() {
  return (
    <div className="flex min-h-full p-2">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-heading text-2xl font-semibold">
            Project ready!
          </h1>
          <p>You may now add components and start building.</p>
          <p>Authentication, storage, and shared UI are already connected.</p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="text-muted-foreground font-mono text-xs">
          (Press <Kbd>d</Kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  );
}
