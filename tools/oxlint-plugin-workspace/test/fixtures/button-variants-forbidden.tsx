import {
  Button,
  buttonVariants as applicationButtonVariants,
} from "@workspace/ui/components/button";

/**
 * Renders a link styled by bypassing the shared button primitive.
 *
 * @returns The incorrectly composed navigation control.
 */
export function ForbiddenButtonLink() {
  return (
    <>
      <Button>Save</Button>
      <a className={applicationButtonVariants()} href="/settings">
        Settings
      </a>
    </>
  );
}
