import { afterEach, expect, spyOn, test } from "bun:test";

import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { ThemeProvider } from "@workspace/ui/next/theme-provider";
import * as cuelume from "cuelume";
import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";

import { AppearanceSettingsBoundary } from "../../components/settings/appearance-settings";
import { SoundSettingsBoundary } from "../../components/settings/sound-settings";
import { SidebarUserMenu } from "../../components/sidebar/sidebar-user-menu";
import {
  SoundEffectsProvider,
  useSoundEffects,
} from "../../lib/sound-effects/sound-effects";

let mountedSoundEffects: ReturnType<typeof useSoundEffects> | undefined;

/**
 * Replaces audio playback while preserving calls for integration assertions.
 */
const ignoreAudioPlayback = () => {
  // Browser audio output is outside this DOM integration boundary.
};

/**
 * Displays controls for exercising the application-owned sound boundary.
 *
 * @returns Mounted controls exposing preference and playback behavior.
 */
const SoundControls = () => {
  const soundEffects = useSoundEffects();

  useEffect(() => {
    mountedSoundEffects = soundEffects;

    return () => {
      mountedSoundEffects = undefined;
    };
  }, [soundEffects]);

  return (
    <output
      data-enabled={soundEffects.enabled}
      data-volume={soundEffects.volume}
    />
  );
};

afterEach(() => {
  mountedSoundEffects = undefined;
});

test("connects mounted consumers to persistent cross-tab sound state", async () => {
  window.localStorage.setItem("sound-effects-enabled", "true");
  window.localStorage.setItem("sound-effects-volume", "85");
  const playSound = spyOn(cuelume, "play").mockImplementation(
    ignoreAudioPlayback
  );
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <SoundEffectsProvider>
        <SoundControls />
      </SoundEffectsProvider>
    );
  });

  const output = container.querySelector<HTMLOutputElement>("output");
  const soundEffects = mountedSoundEffects;

  if (output === null || soundEffects === undefined) {
    throw new Error("The sound integration controls should be mounted.");
  }

  expect(output.dataset.enabled).toBe("true");
  expect(output.dataset.volume).toBe("85");

  act(() => {
    soundEffects.setEnabled(false);
  });

  expect(output.dataset.enabled).toBe("false");
  expect(window.localStorage.getItem("sound-effects-enabled")).toBe("false");

  window.localStorage.setItem("sound-effects-enabled", "true");
  act(() => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "sound-effects-enabled",
        newValue: "true",
        storageArea: window.localStorage,
      })
    );
  });

  expect(output.dataset.enabled).toBe("true");

  act(() => {
    soundEffects.setVolume(40);
    soundEffects.play("tick");
  });

  expect(output.dataset.volume).toBe("40");
  expect(window.localStorage.getItem("sound-effects-volume")).toBe("85");
  expect(playSound.mock.calls.map(([sound]) => sound)).toEqual(["tick"]);

  await act(async () => {
    await Bun.sleep(250);
  });

  expect(window.localStorage.getItem("sound-effects-volume")).toBe("40");

  act(() => {
    root.unmount();
  });
  container.remove();
  playSound.mockRestore();
});

test("connects the production Sound card to immediate persisted preferences", async () => {
  window.localStorage.setItem("sound-effects-enabled", "false");
  window.localStorage.setItem("sound-effects-volume", "85");
  const playSound = spyOn(cuelume, "play").mockImplementation(
    ignoreAudioPlayback
  );
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <SoundEffectsProvider>
        <SoundSettingsBoundary />
      </SoundEffectsProvider>
    );
  });

  const soundSwitch =
    container.querySelector<HTMLButtonElement>('[role="switch"]');
  const volumeSlider = container.querySelector<HTMLInputElement>(
    'input[type="range"]'
  );
  const volumeValue = container.querySelector<HTMLOutputElement>(
    '[data-slot="sound-effects-volume-value"]'
  );
  const sliderControl = container.querySelector<HTMLElement>(
    '[data-slot="slider"] > div'
  );

  if (
    soundSwitch === null ||
    volumeSlider === null ||
    volumeValue === null ||
    sliderControl === null
  ) {
    throw new Error("The mounted Sound card should expose both preferences.");
  }

  expect(soundSwitch.getAttribute("aria-checked")).toBe("false");
  expect(volumeSlider.disabled).toBe(true);
  expect(volumeValue.textContent).toBe("85%");

  act(() => {
    soundSwitch.click();
  });

  expect(soundSwitch.getAttribute("aria-checked")).toBe("true");
  expect(volumeSlider.disabled).toBe(false);
  expect(window.localStorage.getItem("sound-effects-enabled")).toBe("true");
  expect(playSound.mock.calls.map(([sound]) => sound)).toEqual(["toggle"]);

  Object.defineProperty(sliderControl, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      bottom: 20,
      height: 20,
      left: 0,
      right: 100,
      toJSON: () => ({}),
      top: 0,
      width: 100,
      x: 0,
      y: 0,
    }),
  });

  act(() => {
    sliderControl.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        buttons: 1,
        clientX: 40,
        clientY: 10,
        pointerId: 0,
        pointerType: "mouse",
      })
    );
    document.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        button: 0,
        clientX: 40,
        clientY: 10,
        pointerId: 0,
        pointerType: "mouse",
      })
    );
  });

  expect(volumeValue.textContent).toBe("40%");
  expect(window.localStorage.getItem("sound-effects-volume")).toBe("85");
  expect(playSound.mock.calls.map(([sound]) => sound)).toEqual([
    "toggle",
    "tick",
  ]);

  await act(async () => {
    await Bun.sleep(250);
  });

  expect(window.localStorage.getItem("sound-effects-volume")).toBe("40");

  act(() => {
    soundSwitch.click();
  });

  expect(soundSwitch.getAttribute("aria-checked")).toBe("false");
  expect(window.localStorage.getItem("sound-effects-enabled")).toBe("false");
  expect(playSound.mock.calls.map(([sound]) => sound)).toEqual([
    "toggle",
    "tick",
    "toggle",
  ]);

  act(() => {
    root.unmount();
  });
  container.remove();
  playSound.mockRestore();
});

test("plays the toggle cue when a theme radio is selected", () => {
  window.localStorage.setItem("sound-effects-enabled", "true");
  window.localStorage.setItem("theme", "light");
  const playSound = spyOn(cuelume, "play").mockImplementation(
    ignoreAudioPlayback
  );
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <SoundEffectsProvider>
        <ThemeProvider>
          <AppearanceSettingsBoundary />
        </ThemeProvider>
      </SoundEffectsProvider>
    );
  });

  const darkRadio = container.querySelector<HTMLElement>(
    '[role="radio"][aria-label="Dark"]'
  );

  if (darkRadio === null) {
    throw new Error("The Appearance card should expose the Dark radio.");
  }

  act(() => {
    darkRadio.click();
  });

  expect(window.localStorage.getItem("theme")).toBe("dark");
  expect(playSound.mock.calls.map(([sound]) => sound)).toEqual(["toggle"]);

  act(() => {
    root.unmount();
  });
  container.remove();
  playSound.mockRestore();
});

test("plays press cues only for the named sidebar account actions", () => {
  window.localStorage.setItem("sound-effects-enabled", "true");
  const { promise: pendingSignOut } = Promise.withResolvers<string | null>();
  const playSound = spyOn(cuelume, "play").mockImplementation(
    ignoreAudioPlayback
  );
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <SoundEffectsProvider>
        <SidebarProvider>
          <SidebarUserMenu
            onSignOut={async () => await pendingSignOut}
            user={{
              id: "user-1",
              image: null,
              isAnonymous: false,
              name: "Aiden Zepp",
              username: "aiden",
            }}
          />
        </SidebarProvider>
      </SoundEffectsProvider>
    );
  });

  const menuTrigger = container.querySelector<HTMLButtonElement>(
    '[data-slot="dropdown-menu-trigger"]'
  );

  if (menuTrigger === null) {
    throw new Error("The sidebar account trigger should be mounted.");
  }

  expect(menuTrigger.dataset.cuelumeToggle).toBe("press");

  act(() => {
    menuTrigger.click();
  });

  const settingsItem = document.body.querySelector<HTMLAnchorElement>(
    'a[href="/settings"]'
  );
  const signOutItem = [
    ...document.body.querySelectorAll<HTMLElement>(
      '[data-slot="dropdown-menu-item"]'
    ),
  ].find((item) => item.textContent?.includes("Sign out"));

  if (settingsItem === null || signOutItem === undefined) {
    throw new Error("The open account menu should expose both actions.");
  }

  expect(settingsItem.dataset.cuelumeToggle).toBe("press");
  expect(signOutItem.dataset.cuelumeToggle).toBe("press");

  act(() => {
    signOutItem.click();
  });

  expect(playSound.mock.calls.map(([sound]) => sound)).toEqual([
    "press",
    "press",
  ]);

  act(() => {
    root.unmount();
  });
  container.remove();
  playSound.mockRestore();
});
