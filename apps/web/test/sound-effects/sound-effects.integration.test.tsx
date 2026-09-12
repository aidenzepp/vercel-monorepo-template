import { afterAll, afterEach, beforeAll, expect, spyOn, test } from "bun:test";

import type * as SidebarModule from "@workspace/ui/components/sidebar";
import * as cuelume from "cuelume";
import { Window } from "happy-dom";
import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";

import type * as SoundSettingsModule from "../../components/settings/sound-settings";
import type * as SidebarUserMenuModule from "../../components/sidebar/sidebar-user-menu";
import type * as SoundEffectsModule from "../../lib/sound-effects/sound-effects";

let SidebarProvider: typeof SidebarModule.SidebarProvider;
let SidebarUserMenu: typeof SidebarUserMenuModule.SidebarUserMenu;
let SoundSettingsBoundary: typeof SoundSettingsModule.SoundSettingsBoundary;
let SoundEffectsProvider: typeof SoundEffectsModule.SoundEffectsProvider;
let useSoundEffects: typeof SoundEffectsModule.useSoundEffects;
let mountedSoundEffects:
  | ReturnType<typeof SoundEffectsModule.useSoundEffects>
  | undefined;

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

/**
 * Browser globals installed for the mounted sound-provider contract.
 */
const BROWSER_GLOBALS = [
  "Element",
  "Event",
  "HTMLButtonElement",
  "HTMLElement",
  "IS_REACT_ACT_ENVIRONMENT",
  "MouseEvent",
  "MutationObserver",
  "Node",
  "PointerEvent",
  "StorageEvent",
  "cancelAnimationFrame",
  "document",
  "getComputedStyle",
  "navigator",
  "requestAnimationFrame",
  "window",
] as const;

/**
 * Original runtime descriptors restored after the browser integration test.
 */
const originalBrowserGlobals = new Map(
  BROWSER_GLOBALS.map((name) => [
    name,
    Object.getOwnPropertyDescriptor(globalThis, name),
  ])
);

/**
 * Browser-compatible document used by the mounted React boundary.
 */
const testWindow = new Window({ url: "https://templ8.test" });

/**
 * Installs Happy DOM capabilities required by React and Cuelume.
 */
const installBrowserGlobals = () => {
  const globals = {
    Element: testWindow.Element,
    Event: testWindow.Event,
    HTMLButtonElement: testWindow.HTMLButtonElement,
    HTMLElement: testWindow.HTMLElement,
    IS_REACT_ACT_ENVIRONMENT: true,
    MouseEvent: testWindow.MouseEvent,
    MutationObserver: testWindow.MutationObserver,
    Node: testWindow.Node,
    PointerEvent: testWindow.PointerEvent,
    StorageEvent: testWindow.StorageEvent,
    cancelAnimationFrame: testWindow.cancelAnimationFrame.bind(testWindow),
    document: testWindow.document,
    getComputedStyle: testWindow.getComputedStyle.bind(testWindow),
    navigator: testWindow.navigator,
    requestAnimationFrame: testWindow.requestAnimationFrame.bind(testWindow),
    window: testWindow,
  };

  for (const [name, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value,
      writable: true,
    });
  }
};

/**
 * Restores every runtime global replaced by the integration environment.
 */
const restoreBrowserGlobals = () => {
  for (const name of BROWSER_GLOBALS) {
    const descriptor = originalBrowserGlobals.get(name);

    if (descriptor === undefined) {
      Reflect.deleteProperty(globalThis, name);
    } else {
      Object.defineProperty(globalThis, name, descriptor);
    }
  }
};

beforeAll(async () => {
  installBrowserGlobals();
  ({ SidebarProvider } = await import("@workspace/ui/components/sidebar"));
  ({ SidebarUserMenu } =
    await import("../../components/sidebar/sidebar-user-menu"));
  ({ SoundSettingsBoundary } =
    await import("../../components/settings/sound-settings"));
  ({ SoundEffectsProvider, useSoundEffects } =
    await import("../../lib/sound-effects/sound-effects"));
});

afterEach(() => {
  mountedSoundEffects = undefined;
  document.body.replaceChildren();
  window.localStorage.clear();
});

afterAll(() => {
  restoreBrowserGlobals();
  testWindow.close();
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
