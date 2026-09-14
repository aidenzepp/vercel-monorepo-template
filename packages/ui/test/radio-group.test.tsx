import { expect, test } from "bun:test";

import { RadioGroup } from "@workspace/ui/components/radio-group";
import { renderToStaticMarkup } from "react-dom/server";

test("renders the segmented radio-group treatment from a named variant", () => {
  const markup = renderToStaticMarkup(<RadioGroup variant="segmented" />);

  expect(markup).toContain('data-variant="segmented"');
  expect(markup).toContain("rounded-full");
  expect(markup).toContain("shadow-xs");
});
