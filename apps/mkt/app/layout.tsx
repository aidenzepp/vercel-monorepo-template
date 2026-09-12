import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { cn } from "@workspace/ui/lib/utils";
import { ThemeProvider } from "@workspace/ui/next/theme-provider";

import "@workspace/ui/globals.css";
import { Geist_Mono, Outfit, Roboto_Slab } from "next/font/google";

/**
 * Supplies the heading font variable shared by the marketing application.
 */
const robotoSlabHeading = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-heading",
});

/**
 * Supplies the sans-serif font variable used by default marketing text.
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
 * Mounts the marketing application's fonts, theme, and observability.
 *
 * @param props - The active marketing route.
 * @param props.children - Supplies the route rendered inside global providers.
 * @returns The marketing application's root document.
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
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
