import { expect, test } from "bun:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  SoundEffectsProvider,
  useSoundEffects,
} from "../../lib/sound-effects/sound-effects";

/**
 * Displays the sound snapshot exposed to a React consumer.
 *
 * @returns A test surface carrying the current sound preference.
 */
const SoundEffectsProbe = () => {
  const soundEffects = useSoundEffects();

  return createElement("output", {
    "data-enabled": soundEffects.enabled,
    "data-volume": soundEffects.volume,
  });
};

test("provides hydration-safe opt-in defaults during server rendering", () => {
  const markup = renderToStaticMarkup(
    createElement(SoundEffectsProvider, null, createElement(SoundEffectsProbe))
  );

  expect(markup).toContain('data-enabled="false"');
  expect(markup).toContain('data-volume="100"');
});

test("rejects sound consumers mounted outside the root provider", () => {
  expect(() => renderToStaticMarkup(createElement(SoundEffectsProbe))).toThrow(
    "useSoundEffects must be used within SoundEffectsProvider"
  );
});
