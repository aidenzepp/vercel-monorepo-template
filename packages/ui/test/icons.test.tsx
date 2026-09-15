import { expect, test } from "bun:test";
import { strict as assert } from "node:assert";

import type { Icon } from "@workspace/ui/icons";
import {
  BadgeCheck,
  CircleInfo,
  Incognito,
  Monitor,
  MoonStars,
  OctagonWarning,
  PersonDoor,
  SidebarLeftHide,
  SidebarLeftShow,
  Sun,
  TriangleWarning,
  User,
  UserSettings,
} from "@workspace/ui/icons";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * One public icon and the glyph name expected in its rendered SVG.
 */
interface IconCase {
  component: Icon;
  name: string;
}

/**
 * Every licensed glyph exposed through the shared icon module.
 */
const ICON_CASES = [
  { component: BadgeCheck, name: "badge-check" },
  { component: CircleInfo, name: "circle-info" },
  { component: Incognito, name: "incognito" },
  { component: Monitor, name: "monitor" },
  { component: MoonStars, name: "moon-stars" },
  { component: OctagonWarning, name: "octagon-warning" },
  { component: PersonDoor, name: "person-door" },
  { component: SidebarLeftHide, name: "sidebar-left-hide" },
  { component: SidebarLeftShow, name: "sidebar-left-show" },
  { component: Sun, name: "sun" },
  { component: TriangleWarning, name: "triangle-warning" },
  { component: User, name: "user" },
  { component: UserSettings, name: "user-settings" },
] satisfies readonly IconCase[];

test("all shared glyphs render both Fill Duo layers", () => {
  for (const { component: IconComponent, name } of ICON_CASES) {
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(
      <IconComponent aria-hidden="true" />
    );

    const icon = container.querySelector<SVGElement>(
      `[data-nucleo-icon="${name}"]`
    );
    assert.ok(icon);

    const foregroundLayers = icon.querySelectorAll('[data-color="color-1"]');
    const bodyLayers = icon.querySelectorAll('[data-color="color-2"]');

    expect(icon.getAttribute("fill")).toBe("currentColor");
    expect(foregroundLayers.length).toBeGreaterThan(0);
    expect(bodyLayers.length).toBeGreaterThan(0);

    for (const layer of bodyLayers) {
      expect(layer.getAttribute("opacity")).toBe("0.4");
    }
  }
});
