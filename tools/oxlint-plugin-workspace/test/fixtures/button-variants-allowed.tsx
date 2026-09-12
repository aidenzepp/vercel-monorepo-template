import { Button } from "@workspace/ui/components/button";

/**
 * Renders a link through the shared button primitive.
 *
 * @returns The composed navigation control.
 */
export function AllowedButtonLink() {
  return <Button render={<a href="/settings" />}>Settings</Button>;
}
