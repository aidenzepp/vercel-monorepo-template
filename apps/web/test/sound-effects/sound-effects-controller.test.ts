import { expect, test } from "bun:test";

import { createSoundEffectsController } from "../../lib/sound-effects/sound-effects-controller";

/**
 * Provides an inert subscriber when a test only needs controller activation.
 */
const ignoreControllerChange = () => {
  // These tests observe controller effects through the event log.
};

/**
 * Creates observable sound-controller dependencies for behavior tests.
 *
 * @param options - Saved browser preferences supplied during restoration.
 * @param options.savedEnabled - The sound opt-in restored for a new subscriber.
 * @param options.savedVolume - The volume restored for a new subscriber.
 * @returns The controller and controls for observing external effects.
 */
const createTestController = ({
  savedEnabled = true,
  savedVolume = 85,
}: {
  savedEnabled?: boolean;
  savedVolume?: number;
} = {}) => {
  const events: string[] = [];
  let currentSavedEnabled = savedEnabled;
  let currentSavedVolume = savedVolume;
  let enabledStorageListener: ((enabled: boolean) => void) | undefined;
  let volumeStorageListener: ((volume: number) => void) | undefined;
  let pendingVolumeSave: (() => void) | undefined;

  const controller = createSoundEffectsController({
    applyEnabled: (enabled) => {
      events.push(`enabled:${enabled}`);
    },
    applyVolume: (volume) => {
      events.push(`volume:${volume}`);
    },
    bind: () => {
      events.push("bind");
    },
    scheduleVolumeSave: (saveVolume) => {
      events.push("schedule:volume");
      pendingVolumeSave = saveVolume;

      return () => {
        events.push("cancel:volume");
        if (pendingVolumeSave === saveVolume) {
          pendingVolumeSave = undefined;
        }
      };
    },
    storage: {
      loadEnabled: () => {
        events.push("load:enabled");
        return currentSavedEnabled;
      },
      loadVolume: () => {
        events.push("load:volume");
        return currentSavedVolume;
      },
      saveEnabled: (enabled) => {
        events.push(`save:enabled:${enabled}`);
        currentSavedEnabled = enabled;
      },
      saveVolume: (volume) => {
        events.push(`save:volume:${volume}`);
        currentSavedVolume = volume;
      },
      subscribe: (onEnabledChange, onVolumeChange) => {
        events.push("subscribe:storage");
        enabledStorageListener = onEnabledChange;
        volumeStorageListener = onVolumeChange;

        return () => {
          events.push("unsubscribe:storage");
          enabledStorageListener = undefined;
          volumeStorageListener = undefined;
        };
      },
    },
  });

  return {
    controller,
    events,
    flushVolumeSave: () => {
      const saveVolume = pendingVolumeSave;
      pendingVolumeSave = undefined;
      saveVolume?.();
    },
    sendEnabledStorageChange: (enabled: boolean) => {
      currentSavedEnabled = enabled;
      enabledStorageListener?.(enabled);
    },
    sendVolumeStorageChange: (volume: number) => {
      currentSavedVolume = volume;
      volumeStorageListener?.(volume);
    },
  };
};

test("restores sound preferences before binding global interactions", () => {
  const { controller, events } = createTestController();

  expect(events).toEqual(["enabled:false", "volume:1"]);

  controller.subscribe(ignoreControllerChange);

  expect(events.indexOf("enabled:true")).toBeLessThan(events.indexOf("bind"));
  expect(events.indexOf("volume:0.85")).toBeLessThan(events.indexOf("bind"));
  expect(controller.getEnabled()).toBe(true);
  expect(controller.getVolume()).toBe(85);
});

test("applies and persists a sound opt-in before notifying consumers", () => {
  const { controller, events } = createTestController();
  controller.subscribe(() => {
    events.push(`notified:${controller.getEnabled()}`);
  });
  events.length = 0;

  controller.setEnabled(false);

  expect(events).toEqual([
    "enabled:false",
    "save:enabled:false",
    "notified:false",
  ]);
  expect(controller.getEnabled()).toBe(false);
});

test("applies volume immediately and persists only the latest settled value", () => {
  const { controller, events, flushVolumeSave } = createTestController();
  controller.subscribe(() => {
    events.push(`notified:volume:${controller.getVolume()}`);
  });
  events.length = 0;

  controller.setVolume(80);
  controller.setVolume(75);

  expect(events).toEqual([
    "volume:0.8",
    "notified:volume:80",
    "schedule:volume",
    "volume:0.75",
    "notified:volume:75",
    "cancel:volume",
    "schedule:volume",
  ]);

  events.length = 0;
  flushVolumeSave();

  expect(events).toEqual(["save:volume:75"]);
  expect(controller.getVolume()).toBe(75);
});

test("rejects volume values outside the settings slider domain", () => {
  const { controller, events } = createTestController();
  controller.subscribe(ignoreControllerChange);
  events.length = 0;

  for (const invalidVolume of [Number.NaN, -5, 84, 84.5, 105]) {
    controller.setVolume(invalidVolume);
  }

  expect(events).toEqual([]);
  expect(controller.getVolume()).toBe(85);
});

test("applies sound preferences received from another tab", () => {
  const {
    controller,
    events,
    sendEnabledStorageChange,
    sendVolumeStorageChange,
  } = createTestController();
  controller.subscribe(() => {
    events.push(
      `notified:${controller.getEnabled()}:${controller.getVolume()}`
    );
  });
  events.length = 0;

  sendEnabledStorageChange(false);
  sendVolumeStorageChange(40);

  expect(events).toEqual([
    "enabled:false",
    "notified:false:85",
    "volume:0.4",
    "notified:false:40",
  ]);
});

test("keeps a pending local volume authoritative over an overlapping tab change", () => {
  const { controller, events, flushVolumeSave, sendVolumeStorageChange } =
    createTestController();
  controller.subscribe(ignoreControllerChange);
  controller.setVolume(80);
  sendVolumeStorageChange(40);
  events.length = 0;

  flushVolumeSave();

  expect(events).toEqual(["volume:0.8", "save:volume:80"]);
  expect(controller.getVolume()).toBe(80);
});

test("restarts storage synchronization after a subscriber gap without rebinding interactions", () => {
  const { controller, events } = createTestController();
  const unsubscribe = controller.subscribe(ignoreControllerChange);
  unsubscribe();
  expect(events.at(-1)).toBe("unsubscribe:storage");
  events.length = 0;

  controller.subscribe(ignoreControllerChange);

  expect(events).toEqual([
    "subscribe:storage",
    "load:enabled",
    "enabled:true",
    "load:volume",
  ]);
  expect(events).not.toContain("bind");
});
