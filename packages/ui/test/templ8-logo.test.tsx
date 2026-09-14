import { expect, test } from "bun:test";

import { Templ8Logo } from "@workspace/ui/logos/templ8";
import { renderToStaticMarkup } from "react-dom/server";

test("isolates the templ8 ball from its construction lines with theme colors", () => {
  const markup = renderToStaticMarkup(<Templ8Logo aria-hidden="true" />);
  const document = new DOMParser().parseFromString(markup, "image/svg+xml");
  const svg = document.documentElement;

  expect(svg.getAttribute("fill")).toBe("none");
  expect(svg.getAttribute("viewBox")).toBe("0 0 100 100");
  expect(svg.querySelectorAll(".stroke-foreground")).toHaveLength(1);
  expect(svg.querySelectorAll(".fill-background")).toHaveLength(2);
  expect(svg.querySelectorAll(".fill-foreground")).toHaveLength(2);
  expect(svg.querySelector("circle.fill-background")?.getAttribute("r")).toBe(
    "26.5"
  );
});
