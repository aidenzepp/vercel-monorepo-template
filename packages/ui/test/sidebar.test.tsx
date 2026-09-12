import { expect, test } from "bun:test";

import {
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { renderToStaticMarkup } from "react-dom/server";

test("gives the sidebar trigger one click-backed toggle cue", () => {
  const markup = renderToStaticMarkup(
    <SidebarProvider>
      <SidebarTrigger />
    </SidebarProvider>
  );

  expect(markup).toMatch(
    /<button(?=[^>]*data-sidebar="trigger")(?=[^>]*data-cuelume-toggle="toggle")[^>]*>/u
  );
});
