import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@workspace/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "group/button aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 inline-flex shrink-0 items-center justify-center rounded-2xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-(--button-focus-color)/40 focus-visible:ring-3 focus-visible:ring-(--button-focus-color)/20 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-3 dark:focus-visible:ring-(--button-focus-color)/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      color: {
        default:
          "[--button-color-foreground:var(--primary)] [--button-color:var(--primary)] [--button-focus-color:var(--primary)] [--button-solid-foreground:var(--primary-foreground)] dark:[--button-color-foreground:color-mix(in_oklch,var(--primary),white_45%)]",
        neutral:
          "[--button-color-foreground:var(--secondary-foreground)] [--button-color:var(--foreground)] [--button-focus-color:var(--ring)] [--button-solid-foreground:var(--background)]",
        destructive:
          "[--button-color-foreground:var(--destructive-foreground)] [--button-color:var(--destructive)] [--button-focus-color:var(--destructive)] [--button-solid-foreground:var(--background)] dark:[--button-solid-foreground:var(--foreground)]",
        success:
          "[--button-color-foreground:var(--success-foreground)] [--button-color:var(--success)] [--button-focus-color:var(--success)] [--button-solid-foreground:var(--foreground)] dark:[--button-solid-foreground:var(--background)]",
        warning:
          "[--button-color-foreground:var(--warning-foreground)] [--button-color:var(--warning)] [--button-focus-color:var(--warning)] [--button-solid-foreground:var(--foreground)] dark:[--button-solid-foreground:var(--background)]",
      },
      variant: {
        primary:
          "bg-(--button-color) text-(--button-solid-foreground) hover:bg-(--button-color)/80",
        outline:
          "border-border bg-background text-(--button-color-foreground) hover:bg-(--button-color)/10 hover:text-(--button-color-foreground) aria-expanded:bg-(--button-color)/10 aria-expanded:text-(--button-color-foreground) dark:bg-transparent dark:hover:bg-(--button-color)/20",
        secondary:
          "bg-secondary aria-expanded:bg-secondary text-(--button-color-foreground) hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:text-(--button-color-foreground)",
        ghost:
          "text-(--button-color-foreground) hover:bg-(--button-color)/10 hover:text-(--button-color-foreground) aria-expanded:bg-(--button-color)/10 aria-expanded:text-(--button-color-foreground) dark:hover:bg-(--button-color)/20",
        soft: "bg-(--button-color)/10 text-(--button-color-foreground) hover:bg-(--button-color)/20 dark:bg-(--button-color)/20 dark:hover:bg-(--button-color)/30",
        link: "text-(--button-color-foreground) underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      color: "default",
      variant: "primary",
      size: "default",
    },
  }
);

function Button({
  className,
  color = "default",
  variant = "primary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-color={color}
      data-variant={variant}
      className={cn(buttonVariants({ color, variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
