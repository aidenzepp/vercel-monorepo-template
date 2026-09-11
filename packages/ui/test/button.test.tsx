import { expect, test } from "bun:test";

import { Button } from "@workspace/ui/components/button";
import { renderToStaticMarkup } from "react-dom/server";

test("loading buttons disable interaction and show an inheriting spinner", () => {
  const markup = renderToStaticMarkup(
    <Button color="destructive" loading variant="ghost">
      Saving…
    </Button>
  );

  expect(markup).toContain('aria-busy="true"');
  expect(markup).toContain("disabled");
  expect(markup).toContain('data-slot="spinner"');
  expect(markup).toContain('stroke="currentColor"');
  expect(markup).toContain("text-(--button-color-foreground)");
  expect(markup).toContain("Saving…");
});
