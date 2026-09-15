import { Button } from "@workspace/ui/components/button";

/**
 * Exercises every rule enabled by Ultracite's Shadcn preset.
 *
 * @param props - The deliberately invalid class input.
 * @param props.color - A dynamic Tailwind color fragment.
 * @returns Deliberately invalid design-system usage for integration testing.
 */
const ShadcnPresetFixture = ({ color }: { color: string }) => (
  <>
    <Button className="rounded-huge bg-pink-500 p-[13px]">Save</Button>
    <Button className={`bg-${color}`}>Dynamic</Button>
    <div style={{ color: "red" }} />
  </>
);

export { ShadcnPresetFixture };
