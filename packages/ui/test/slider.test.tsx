import { expect, test } from "bun:test";

import { Slider } from "@workspace/ui/components/slider";
import { renderToStaticMarkup } from "react-dom/server";

test("renders one interactive thumb for a scalar value", () => {
  const markup = renderToStaticMarkup(<Slider max={100} min={0} value={85} />);
  const thumbCount = markup.match(/data-slot="slider-thumb"/gu)?.length ?? 0;

  expect(thumbCount).toBe(1);
});
