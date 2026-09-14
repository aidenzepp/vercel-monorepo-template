import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@workspace/ui/components/toast";
import { cn } from "@workspace/ui/lib/utils";
import { ThemeProvider } from "@workspace/ui/next/theme-provider";
import type { Metadata } from "next";

import "@workspace/ui/globals.css";
import { Geist_Mono, Outfit, Roboto_Slab } from "next/font/google";

import { SoundEffectsProvider } from "@/lib/sound-effects/sound-effects";

/**
 * The dark-appearance templ8 favicon bundled with the web application.
 */
const iconTempl8Dark = new URL(
  "../assets/icons/icon-templ8-dark.svg",
  import.meta.url
);

/**
 * The light-appearance templ8 favicon bundled with the web application.
 */
const iconTempl8Light = new URL(
  "../assets/icons/icon-templ8-light.svg",
  import.meta.url
);

/**
 * Identifies templ8 and selects a contrast-correct favicon for each system
 * appearance.
 *
 * Standalone favicon SVGs cannot inherit the page's CSS variables, so the
 * assets resolve the current Shadcn foreground and background tokens directly.
 * The canvas outside the ball remains transparent so browser chrome can show
 * around its silhouette.
 *
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata#icons
 */
export const metadata: Metadata = {
  applicationName: "templ8",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        sizes: "any",
        type: "image/svg+xml",
        url: iconTempl8Light,
      },
      {
        media: "(prefers-color-scheme: dark)",
        sizes: "any",
        type: "image/svg+xml",
        url: iconTempl8Dark,
      },
    ],
  },
  title: "templ8",
};

/**
 * Supplies the heading font variable shared by the web application.
 */
const robotoSlabHeading = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-heading",
});

/**
 * Supplies the sans-serif font variable used by default application text.
 */
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

/**
 * Supplies the monospace font variable used by code-oriented content.
 */
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

/**
 * Mounts the web application's fonts, theme, notifications, and observability.
 *
 * @param props - The active web application route.
 * @param props.children - Supplies the route rendered inside global providers.
 * @returns The web application's root document.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        outfit.variable,
        robotoSlabHeading.variable
      )}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <SoundEffectsProvider>
            {children}
            <Toaster />
          </SoundEffectsProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
