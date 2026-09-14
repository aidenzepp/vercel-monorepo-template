import { cn } from "@workspace/ui/lib/utils";
import type { ComponentProps } from "react";

type Templ8WordmarkProps = ComponentProps<"svg">;
type Templ8LogoProps = ComponentProps<"svg">;

/**
 * Displays the templ8 eight-ball mark with theme-aware layers.
 *
 * The ball and numeral use the foreground token while the inset and highlight
 * use the background token. The canvas outside the ball stays transparent.
 *
 * @param props - Standard SVG presentation and accessibility attributes.
 * @param props.className - Adds contextual sizing or placement classes.
 * @returns The reusable templ8 logo mark.
 */
const Templ8Logo = ({ className, ...props }: Templ8LogoProps) => (
  <svg
    aria-label="templ8"
    className={cn(className)}
    fill="none"
    focusable="false"
    role="img"
    viewBox="0 0 117.6 118"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      className="fill-foreground"
      d="m59 1.5c-31.4 0-57.2 25.9-57.2 57.5 0 29.4 21.9 57.4 56.8 57.4 29.8 0 57.4-24.4 57.3-57.1-0.1-27.3-21.4-57.8-56.9-57.8z"
    />
    <path
      className="fill-background"
      d="m67.4 15.7c-1-0.3-1.7-0.7-1.5-1.7s1.4-1.5 4.1-1.3c12 0.5 24.4 8.3 29.4 18.8 1.4 3 2.2 6.4 0.1 8.2-3.6 2-4.9-3.6-9.4-9.2-6.1-7.6-13.9-12-22.7-14.8z"
    />
    <path
      className="fill-background"
      d="m58.6 28.6c-14-0.1-28.6 11.2-31.2 25.7-2.1 13.2 5.8 35.6 30.1 36.8 17.8-0.1 31.8-12.2 32-31.6 0.1-15-11.8-30.9-30.9-30.9z"
    />
    <path
      className="fill-foreground"
      d="m67 57.7c2.2-0.9 5.1-3.7 5.1-8.2 0-5.5-4.7-12-13.6-11.9s-14.2 5.2-14.2 12c0.1 4.4 3.3 7.1 4.9 8.1-2.7 1.1-6.9 4-6.9 10.1 0.1 5.5 4.1 12 15.3 12.8 9.9 0.1 16.6-5 16.5-13.2-0.2-6.1-4.7-8.7-7.1-9.7zm-8.9-12.2c2.4 0 4.5 1.6 4.5 4.4 0 2.7-2.2 4.2-4.6 4.2s-4.4-1.8-4.4-4c0-2.7 2.1-4.6 4.5-4.6zm-0.1 27.3c-2.8 0-5.6-1.8-5.6-5.3 0.1-3.3 2.7-5.5 5.7-5.5 2.6 0 5.6 1.7 5.7 5.3 0 4.1-3.3 5.5-5.8 5.5z"
    />
  </svg>
);

/**
 * The templ8 wordmark, colored by the active foreground and background tokens.
 *
 * The negative letterforms intentionally use the page background so the mark
 * stays legible when the theme changes without baking colors into the asset.
 *
 * @param props - Standard SVG presentation and accessibility attributes.
 * @param props.className - Adds contextual sizing or placement classes.
 * @returns The theme-aware templ8 wordmark.
 */
const Templ8Wordmark = ({ className, ...props }: Templ8WordmarkProps) => (
  <svg
    aria-label="templ8"
    className={cn(className)}
    focusable="false"
    role="img"
    viewBox="86 155.7 93 34"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      className="fill-foreground"
      d="m163 155.7c-3.2 0.2-6 1.5-10.2 4.2-0.7-1.9-2.4-4.2-6.2-4.1-2.9 0.1-5.9 2.2-6.1 6-1.4-0.3-3.1-0.3-5.4 0.7-0.9-0.4-2.9-0.3-4.1 0.3-1.9-1.3-4.5-2.2-8-0.3-1-0.4-2.5-0.9-4.1-0.6-1.9-1-5.1-1.6-8.1 1.1-2.1-1-5.6-1.4-8.4 0.9l-0.7-0.4c-0.4-3-3-5.2-6.1-5.3-2.3 0-3.6 0.9-4.5 1.9s-1.3 2.4-1.4 3.7c-1 0.5-3.1 2.2-3 5.5 0.1 3.6 2.3 5.2 3.3 5.7 0 3.2 0.2 4.9 1.2 6.9 0.9 1.8 3 4.7 7.4 4.7 1.8 0 3.4-0.5 5.1-1.7 2.3 1 6.1 1.1 9.6-1 1.6 0.7 4.5 0.7 6.2-0.4 1.6 0.9 4.4 0.8 5.4 0.1 0.5 0.4 1.6 0.8 2.6 0.9 0.4 2.7 2.7 4.9 6 4.9 3.1 0 6.3-1.2 8-4.9 0.6-0.2 1.2-0.4 1.6-0.8 1.4 1 3 1.7 4.9 1.6 1.4 0 2.7-0.4 3.6-1 3.1 2.2 5.9 3.6 10.4 3.6 7.7 0 15.9-5.8 16.2-15.5 0-7.9-6.1-16.9-15.2-16.7z"
    />
    <path
      className="fill-background"
      d="m163.9 159.3c0-0.7 2-0.4 3-0.1 1.9 0.4 4 1.8 5.2 3.7 0.6 0.8 1.1 2.1 0.2 2.7-0.7 0.1-1-0.6-1.6-1.2-1.4-1.8-3.8-3.9-6.4-4.7-0.4-0.1-0.4-0.3-0.4-0.4z"
    />
    <path
      className="fill-background"
      d="m98.4 166.5-0.1-2.1c-0.2-1.3-1-2.6-2.8-2.6-1.7 0.1-2.6 1-2.6 2.7l0.1 2-1.2 0.1c-1.3 0.3-1.8 1.3-1.5 3.1 0.2 1.2 1.1 2 2.3 1.9h0.6l0.2 5.3c0.2 2.6 0.8 5.9 4.5 6 3 0 3.9-2 3.1-4.1-0.7-1.5-1-0.9-1.9-1.2-0.7-0.4-0.7-1.5-0.7-2.3v-3.7l1.2-0.1c1.2-0.2 1.4-1.9 1.4-2.8-0.1-1.2-0.7-2.1-1.7-2.1l-0.9-0.1z"
    />
    <path
      className="fill-background"
      d="m106 175.8c0.3-0.2 5.9 0.1 6.2-4.2 0.3-3.7-2-5.8-4.8-5.8-4.5 0-6.6 4.4-6.7 8.3 0 3.4 1.8 7.7 6.2 7.7 2.7 0 5.4-1.7 5.4-4.4 0-1.2-0.8-2-2-1.8-1.7 0.3-1.8 1.7-3.3 1.6-0.7-0.1-1.5-1.2-1-1.4zm0.8-5.9c1 0 1.1 1.7 0.3 2.4s-1.5 0.5-1.5 0.1c-0.1-1.1 0.4-2.3 1.2-2.5z"
    />
    <path
      className="fill-background"
      d="m112.6 168.2c0.7 2.4 0.2 4.7 0.3 9.4-0.1 1.8 0.8 2.9 2.6 2.9 1.4 0 2.3-1 2.4-2 0.3-2.1-0.5-8 0.4-8.2 0.7-0.3 1 0.6 1 1.3 0.1 3.2-0.4 5.8 0.4 7.3 0.4 0.7 1.1 1.2 2.1 1.2 2.1 0 2.4-1.4 2.4-2.7l-0.1-5.1c0-0.8 0-1.8 0.7-2 0.7 0 0.8 1 0.8 2.1 0 3.6-0.7 7.4 1.9 8.1 2.8 0.4 3.1-1.7 2.8-3.9l-0.3-1.6c0-2 0-4.1-0.1-6.1-0.1-2.2-1.2-4-3.2-4-1.3 0-2.6 0.7-3.6 1.9-1.2-1.9-3.6-2.4-5.3-1-1.2-2.1-3.9-1.3-4.8 0.2-0.5 1-0.4 2-0.4 2.2z"
    />
    <path
      className="fill-background"
      d="m138.1 165.1c-1.1 0-1.9 0.5-2.7 1.3-0.5-0.7-1.5-1-2.6-0.8-1.5 0.3-2 1.7-2 2.6l0.1 3.4 0.2 4.7c0 3.1-1 5.3-0.4 7.7 0.5 1.1 1.2 1.8 2.6 1.8 1.3 0.1 2.6-0.7 2.9-1.7 0.4-1.3 0-2.9-0.1-4.7 0.8 0.7 1.4 0.9 2.3 0.9 2.1 0.1 4-1.9 4.3-4.4 0.2-1.1 0.3-2.2 0.3-3.3-0.1-4.4-2-7.4-4.9-7.5zm-1.2 10.5c-0.5 0-0.9-0.6-0.9-1.1-0.1-0.6-0.2-3.1 0.2-3.9 0.2-0.2 0.4-0.4 0.7-0.4 0.8 0 1.2 1.3 1.1 3.2 0 1-0.4 2.2-1.1 2.2z"
    />
    <path
      className="fill-background"
      d="m143.4 164.7c-0.2-1.7-0.9-4.5 1.1-5.3 1.6-0.7 3.8-0.3 4 2.8v12.3c0.1 2.1 1 1.2 1.4 3.5 0 1.7-0.8 3.3-2.8 3.3-1.5 0-2.8-0.8-3.3-2.3-0.5-1.1-0.3-3.6-0.3-5.8 0-2.9 0-5.8-0.1-8.5z"
    />
    <path
      className="fill-background"
      d="m160.8 164c-4.5 0-8.4 3.9-8.4 8.5s3.3 8.9 8.3 8.9c4.6 0 8.5-3.5 8.5-8.5 0-4.7-3.8-8.8-8.4-8.9z"
    />
    <path
      className="fill-foreground"
      d="m163.1 172.2c0.8-0.6 1.3-1.4 1.3-2.6 0-1.6-1.4-3.1-3.5-3.1-1.8 0-3.4 1.3-3.4 3 0 1.1 0.5 1.9 1.2 2.6-0.9 0.5-1.8 1.5-1.8 3.1 0 2.1 1.6 3.6 4 3.6 2.2 0 4-1.6 4-3.5 0-1.4-0.6-2.5-1.8-3.1zm-2.3-3.8c0.7 0 1.1 0.7 1.1 1.2 0 0.8-0.5 1.4-1.2 1.4-0.6 0-1.2-0.6-1.2-1.3s0.6-1.3 1.3-1.3zm-0.1 8.3c-0.7 0-1.4-0.6-1.4-1.5 0-0.8 0.6-1.8 1.6-1.8 0.9 0 1.5 0.7 1.5 1.6 0 1-0.8 1.7-1.7 1.7z"
    />
  </svg>
);

export { Templ8Logo, Templ8Wordmark };
