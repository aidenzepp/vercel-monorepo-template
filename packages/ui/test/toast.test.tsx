import { expect, test } from "bun:test";

import {
  Toast,
  ToastDescription,
  ToastProvider,
} from "@workspace/ui/components/toast";
import { renderToStaticMarkup } from "react-dom/server";

test("status toasts retain distinct rich-color cues in light and dark themes", () => {
  const markup = renderToStaticMarkup(
    <ToastProvider>
      <Toast toast={{ id: "status-toast", type: "success" }}>
        <ToastDescription>Saved</ToastDescription>
      </Toast>
    </ToastProvider>
  );

  expect(markup).toContain('data-type="success"');
  expect(markup).toContain("data-[type=success]:bg-[hsl(143_85%_96%)]");
  expect(markup).toContain("data-[type=info]:bg-[hsl(208_100%_97%)]");
  expect(markup).toContain("data-[type=warning]:bg-[hsl(49_100%_97%)]");
  expect(markup).toContain("data-[type=error]:bg-[hsl(359_100%_97%)]");
  expect(markup).toContain("dark:data-[type=success]:bg-[hsl(150_100%_6%)]");
  expect(markup).toContain("dark:data-[type=info]:bg-[hsl(215_100%_6%)]");
  expect(markup).toContain("dark:data-[type=warning]:bg-[hsl(64_100%_6%)]");
  expect(markup).toContain("dark:data-[type=error]:bg-[hsl(358_76%_10%)]");
  expect(markup).toContain("group-data-[type=success]/toast:text-inherit");
});
