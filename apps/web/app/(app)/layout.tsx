import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { Templ8Wordmark } from "@workspace/ui/logos/templ8";
import Link from "next/link";

import { SessionProvider } from "@/components/auth/session-provider";
import { SidebarUserMenuBoundary } from "@/components/sidebar/sidebar-user-menu";
import { requireSession } from "@/lib/auth/session-server";

/**
 * Displays the home link in the application sidebar header.
 *
 * @returns The theme-aware templ8 wordmark link.
 */
const SidebarBrand = () => (
  <SidebarHeader className="h-16 items-center justify-center px-2">
    <Link aria-label="templ8 home" className="flex w-fit items-center" href="/">
      <Templ8Wordmark aria-hidden="true" className="h-8 w-auto" />
    </Link>
  </SidebarHeader>
);

/**
 * Displays product navigation and the current user's account menu.
 *
 * @returns The inset application sidebar.
 */
const AppSidebar = () => (
  <Sidebar collapsible="offcanvas" variant="inset">
    <SidebarBrand />
    <SidebarContent />
    <SidebarFooter className="p-2">
      <SidebarUserMenuBoundary />
    </SidebarFooter>
  </Sidebar>
);

/**
 * Displays the control that opens or collapses the application sidebar.
 *
 * @returns The application header.
 */
const AppHeader = () => (
  <header className="flex h-14 shrink-0 items-center px-4">
    <SidebarTrigger className="-ms-1" />
  </header>
);

/**
 * Arranges protected page content beside the inset application sidebar.
 *
 * @param props - The protected route content.
 * @param props.children - Supplies the active application page.
 * @returns The application shell shared by protected routes.
 */
const AppShell = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppHeader />
      <div className="flex min-h-0 flex-1 flex-col p-4 pt-0">{children}</div>
    </SidebarInset>
  </SidebarProvider>
);

/**
 * Requires one authenticated session before rendering the protected
 * application.
 *
 * @param props - The active protected route.
 * @param props.children - Supplies the page rendered inside the application
 *   shell.
 * @returns The protected route with its hydrated session and shared shell.
 * @see {@link SessionProvider}
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();

  return (
    <SessionProvider session={session}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
