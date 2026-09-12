import { expect, test } from "bun:test";

import { createSoundEffectsStorage } from "../../lib/sound-effects/sound-effects-storage";

/**
 * Provides an inert cleanup callback for tests without storage events.
 */
const ignoreStorageSubscription = () => {
  // These tests do not install a storage listener.
};

/**
 * In-memory browser storage used to exercise preference decoding.
 */
class MemoryStorage {
  /**
   * The canonical string values currently stored by key.
   */
  readonly values = new Map<string, string>();

  /**
   * Whether reads should simulate unavailable browser storage.
   */
  failReads = false;

  /**
   * Whether writes should simulate unavailable browser storage.
   */
  failWrites = false;

  /**
   * Returns the saved string for one preference key.
   *
   * @param key - The browser-storage key being read.
   * @returns The saved value, or null when the key is absent.
   */
  getItem(key: string) {
    if (this.failReads) {
      throw new Error("Storage is unavailable");
    }

    return this.values.get(key) ?? null;
  }

  /**
   * Saves one canonical preference string.
   *
   * @param key - The browser-storage key being written.
   * @param value - The canonical value to retain.
   */
  setItem(key: string, value: string) {
    if (this.failWrites) {
      throw new Error("Storage is unavailable");
    }

    this.values.set(key, value);
  }
}

test("uses opt-in defaults when no sound preference is stored", () => {
  const soundEffectsStorage = createSoundEffectsStorage({
    storage: new MemoryStorage(),
    subscribeToStorage: () => ignoreStorageSubscription,
  });

  expect(soundEffectsStorage.loadEnabled()).toBe(false);
  expect(soundEffectsStorage.loadVolume()).toBe(100);
});

test("restores canonical saved sound preferences", () => {
  const storage = new MemoryStorage();
  storage.values.set("sound-effects-enabled", "true");
  storage.values.set("sound-effects-volume", "85");
  const soundEffectsStorage = createSoundEffectsStorage({
    storage,
    subscribeToStorage: () => ignoreStorageSubscription,
  });

  expect(soundEffectsStorage.loadEnabled()).toBe(true);
  expect(soundEffectsStorage.loadVolume()).toBe(85);
});

test("rejects malformed and off-step stored volume values", () => {
  const invalidValues = ["", "01", "84", "-1", "101", "NaN"];

  for (const invalidValue of invalidValues) {
    const storage = new MemoryStorage();
    storage.values.set("sound-effects-volume", invalidValue);
    const soundEffectsStorage = createSoundEffectsStorage({
      storage,
      subscribeToStorage: () => ignoreStorageSubscription,
    });

    expect(soundEffectsStorage.loadVolume()).toBe(100);
  }
});

test("uses safe defaults when browser storage cannot be read", () => {
  const storage = new MemoryStorage();
  storage.failReads = true;
  const soundEffectsStorage = createSoundEffectsStorage({
    storage,
    subscribeToStorage: () => ignoreStorageSubscription,
  });

  expect(soundEffectsStorage.loadEnabled()).toBe(false);
  expect(soundEffectsStorage.loadVolume()).toBe(100);
});

test("persists the sound opt-in under its neutral browser key", () => {
  const storage = new MemoryStorage();
  const soundEffectsStorage = createSoundEffectsStorage({
    storage,
    subscribeToStorage: () => ignoreStorageSubscription,
  });

  const savedPreference = soundEffectsStorage.saveEnabled(true);

  expect(savedPreference.ok).toBe(true);
  expect(storage.values.get("sound-effects-enabled")).toBe("true");
  expect(storage.values.has("activity-sound-effects-enabled")).toBe(false);
});

test("persists volume under its neutral browser key", () => {
  const storage = new MemoryStorage();
  const soundEffectsStorage = createSoundEffectsStorage({
    storage,
    subscribeToStorage: () => ignoreStorageSubscription,
  });

  const savedPreference = soundEffectsStorage.saveVolume(85);

  expect(savedPreference.ok).toBe(true);
  expect(storage.values.get("sound-effects-volume")).toBe("85");
  expect(storage.values.has("activity-sound-effects-volume")).toBe(false);
});

test("reports unavailable browser storage without rejecting the local preference", () => {
  const storage = new MemoryStorage();
  storage.failWrites = true;
  const soundEffectsStorage = createSoundEffectsStorage({
    storage,
    subscribeToStorage: () => ignoreStorageSubscription,
  });

  expect(soundEffectsStorage.saveEnabled(true).ok).toBe(false);
  expect(soundEffectsStorage.saveVolume(85).ok).toBe(false);
});

test("rereads authoritative sound preferences after another tab changes storage", () => {
  const storage = new MemoryStorage();
  let storageListener:
    | ((
        key: string | null,
        newValue: string | null,
        storageArea?: Pick<Storage, "getItem" | "setItem"> | null
      ) => void)
    | undefined;
  const soundEffectsStorage = createSoundEffectsStorage({
    storage,
    subscribeToStorage: (listener) => {
      storageListener = listener;
      return () => {
        storageListener = undefined;
      };
    },
  });
  const enabledPreferences: boolean[] = [];
  const volumePreferences: number[] = [];
  soundEffectsStorage.subscribe(
    (enabled) => {
      enabledPreferences.push(enabled);
    },
    (volume) => {
      volumePreferences.push(volume);
    }
  );
  storage.values.set("sound-effects-enabled", "true");
  storage.values.set("sound-effects-volume", "85");

  storageListener?.("sound-effects-enabled", "false", storage);
  storageListener?.("sound-effects-volume", "40", storage);

  expect(enabledPreferences).toEqual([true]);
  expect(volumePreferences).toEqual([85]);
});
