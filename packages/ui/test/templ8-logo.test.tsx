import { expect, test } from "bun:test";

import { Templ8Logo } from "@workspace/ui/logos/templ8";
import { renderToStaticMarkup } from "react-dom/server";

test("renders the templ8 eight-ball without construction strokes", () => {
  const markup = renderToStaticMarkup(<Templ8Logo aria-hidden="true" />);
  const document = new DOMParser().parseFromString(markup, "image/svg+xml");
  const svg = document.documentElement;

  expect(svg.getAttribute("fill")).toBe("none");
  expect(svg.getAttribute("viewBox")).toBe("0 0 117.6 118");
  expect(svg.querySelectorAll("[stroke]")).toHaveLength(0);
  expect(svg.querySelectorAll(".fill-background")).toHaveLength(2);
  expect(svg.querySelectorAll(".fill-foreground")).toHaveLength(2);
});
