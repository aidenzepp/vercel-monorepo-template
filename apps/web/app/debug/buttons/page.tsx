import { Button } from "@workspace/ui/components/button";

const colors = [
  "default",
  "neutral",
  "destructive",
  "success",
  "warning",
] as const;

const variants = [
  "primary",
  "secondary",
  "ghost",
  "soft",
  "outline",
  "link",
] as const;

const ButtonIcon = () => (
  <span
    aria-hidden="true"
    className="size-4 rounded-full border border-dashed border-current"
  />
);

export default function ButtonsDebugPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-10 p-6 sm:p-10">
      <header className="flex flex-col gap-2">
        <p className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
          Temporary debug page
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Button matrix</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Every variant and color combination. Press <kbd>d</kbd> to compare the
          light and dark themes.
        </p>
      </header>

      <section className="overflow-x-auto rounded-3xl border p-4 sm:p-6">
        <div className="grid min-w-4xl grid-cols-[7rem_repeat(6,minmax(8rem,1fr))] items-center gap-4">
          <span />
          {variants.map((variant) => (
            <span
              className="text-muted-foreground text-center font-mono text-xs"
              key={variant}
            >
              {variant}
            </span>
          ))}

          {colors.map((color) => (
            <div className="contents" key={color}>
              <span className="font-mono text-xs font-medium">{color}</span>
              {variants.map((variant) => (
                <Button color={color} key={variant} variant={variant}>
                  <ButtonIcon />
                  Label
                  <ButtonIcon />
                </Button>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border p-4 sm:grid-cols-2 sm:p-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium">Sizes</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium">States</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled>Disabled</Button>
            <Button aria-invalid color="destructive" variant="soft">
              Invalid
            </Button>
            <Button aria-expanded color="success" variant="secondary">
              Expanded
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
