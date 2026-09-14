import { Button } from "@workspace/ui/components/button";
import { CardFooter } from "@workspace/ui/components/card";
import { Field, FieldContent } from "@workspace/ui/components/field";

/**
 * Exercises application-owned layout and forbidden Button restyling.
 *
 * @returns Shared primitives composed under the repository design-system
 *   policy.
 */
const ShadcnNoRestyleFixture = () => (
  <Field className="gap-2">
    <FieldContent className="min-w-0 gap-3">Content</FieldContent>
    <CardFooter className="mt-6 justify-end gap-2">
      <Button className="bg-destructive w-full p-8">Save</Button>
    </CardFooter>
  </Field>
);

export { ShadcnNoRestyleFixture };
