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

import { SessionProfile } from "@/components/sidebar/session-profile";
import { SessionProvider } from "@/lib/auth/session";
import { requireSession } from "@/lib/auth/session-server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();

  return (
    <SessionProvider initialSession={session}>
      <SidebarProvider>
        <Sidebar collapsible="offcanvas" variant="inset">
          <SidebarHeader className="h-16 items-center justify-center px-2">
            <Link
              aria-label="templ8 home"
              className="flex w-fit items-center"
              href="/"
            >
              <Templ8Wordmark aria-hidden="true" className="h-8 w-auto" />
            </Link>
          </SidebarHeader>

          <SidebarContent />

          <SidebarFooter className="p-2">
            <SessionProfile />
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center px-4">
            <SidebarTrigger className="-ms-1" />
          </header>
          <div className="flex min-h-0 flex-1 flex-col p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
