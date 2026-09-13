import { expect, test } from "bun:test";

import { renderToStaticMarkup } from "react-dom/server";

import { SoundSettings } from "../../components/settings/sound-settings";

/**
 * Provides an inert preference handler for static markup assertions.
 */
const ignorePreferenceChange = () => {
  // This test verifies presentation without dispatching interactions.
};

test("presents browser-scoped sound controls without form actions", () => {
  const markup = renderToStaticMarkup(
    <SoundSettings
      enabled={false}
      onEnabledChange={ignorePreferenceChange}
      onVolumeChange={ignorePreferenceChange}
      volume={85}
    />
  );

  expect(markup).toContain(">Sound<");
  expect(markup).toContain("Control interface sounds in this browser.");
  expect(markup).toContain("Sound effects");
  expect(markup).toContain("Volume");
  expect(markup).toContain("85%");
  expect(markup).toContain('role="switch"');
  expect(markup).toContain('aria-checked="false"');
  expect(markup).toContain('aria-labelledby="sound-effects-volume-label"');
  expect(markup).toContain("disabled");
  expect(markup).not.toContain("Save changes");
  expect(markup).not.toContain(">Reset<");
});
