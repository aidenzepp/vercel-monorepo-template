import { result } from "@workspace/utils/result";
import type { Result } from "@workspace/utils/result";

/**
 * The local browser key retaining whether interface sounds may play.
 */
const SOUND_EFFECTS_ENABLED_STORAGE_KEY = "sound-effects-enabled";

/**
 * The local browser key retaining the interface-sound volume percentage.
 */
const SOUND_EFFECTS_VOLUME_STORAGE_KEY = "sound-effects-volume";

/**
 * The volume used when no valid browser preference can be restored.
 */
const DEFAULT_SOUND_EFFECTS_VOLUME = 100;

/**
 * The canonical unsigned percentage representation accepted from storage.
 */
const CANONICAL_VOLUME_PATTERN = /^(?:0|[1-9]\d?|100)$/u;

/**
 * Browser capabilities required to restore sound preferences.
 */
type SoundEffectsStorageDependencies = Readonly<{
  storage: Pick<Storage, "getItem" | "setItem">;
  subscribeToStorage: (
    onStorageChange: (
      key: string | null,
      newValue: string | null,
      storageArea?: Pick<Storage, "getItem" | "setItem"> | null
    ) => void
  ) => () => void;
}>;

/**
 * The browser-persistence operations available to the sound controller.
 */
type SoundEffectsStorage = Readonly<{
  loadEnabled: () => boolean;
  loadVolume: () => number;
  saveEnabled: (enabled: boolean) => Result<void>;
  saveVolume: (volume: number) => Result<void>;
  subscribe: (
    onEnabledChange: (enabled: boolean) => void,
    onVolumeChange: (volume: number) => void
  ) => () => void;
}>;

/**
 * Creates the browser-persistence boundary for sound preferences.
 *
 * @param dependencies - Browser storage and change-notification capabilities.
 * @returns The storage operations consumed by sound state.
 */
const createSoundEffectsStorage = (
  dependencies: SoundEffectsStorageDependencies
): SoundEffectsStorage => {
  /**
   * Restores the explicit sound opt-in, falling back safely when unavailable.
   *
   * @returns Whether a literal saved true value permits sound playback.
   */
  const loadEnabled = () => {
    const storedValue = result.trycatch(() =>
      dependencies.storage.getItem(SOUND_EFFECTS_ENABLED_STORAGE_KEY)
    );

    return storedValue.ok && storedValue.value === "true";
  };

  /**
   * Restores the canonical five-point volume percentage.
   *
   * @returns The saved volume, or full volume when storage is invalid.
   */
  const loadVolume = () => {
    const storedValue = result.trycatch(() =>
      dependencies.storage.getItem(SOUND_EFFECTS_VOLUME_STORAGE_KEY)
    );
    const decodedVolume =
      storedValue.ok &&
      storedValue.value !== null &&
      CANONICAL_VOLUME_PATTERN.test(storedValue.value)
        ? Number(storedValue.value)
        : undefined;

    return decodedVolume === undefined || decodedVolume % 5 !== 0
      ? DEFAULT_SOUND_EFFECTS_VOLUME
      : decodedVolume;
  };

  /**
   * Attempts to retain the sound opt-in without throwing browser failures.
   *
   * @param enabled - Whether future interface sounds may play.
   * @returns The captured browser-storage outcome.
   */
  const saveEnabled = (enabled: boolean) =>
    result.trycatch(() => {
      dependencies.storage.setItem(
        SOUND_EFFECTS_ENABLED_STORAGE_KEY,
        String(enabled)
      );
    });

  /**
   * Attempts to retain a settled sound volume without throwing browser
   * failures.
   *
   * @param volume - The canonical integer percentage selected by the user.
   * @returns The captured browser-storage outcome.
   */
  const saveVolume = (volume: number) =>
    result.trycatch(() => {
      dependencies.storage.setItem(
        SOUND_EFFECTS_VOLUME_STORAGE_KEY,
        String(volume)
      );
    });

  /**
   * Reports authoritative sound-preference changes made by another tab.
   *
   * @param onEnabledChange - Receives the latest decoded sound opt-in.
   * @param onVolumeChange - Receives the latest decoded volume percentage.
   * @returns Cleanup for the underlying browser-storage listener.
   */
  const subscribe = (
    onEnabledChange: (enabled: boolean) => void,
    onVolumeChange: (volume: number) => void
  ) => {
    /**
     * Resolves one browser-storage signal to the latest authoritative value.
     *
     * @param key - The changed key, or null when the storage area was cleared.
     * @param _newValue - The event payload, which may already be stale.
     * @param storageArea - The browser storage area that emitted the signal.
     */
    const synchronizeAnotherTab = (
      key: string | null,
      _newValue: string | null,
      storageArea?: Pick<Storage, "getItem" | "setItem"> | null
    ) => {
      if (
        key !== SOUND_EFFECTS_ENABLED_STORAGE_KEY &&
        key !== SOUND_EFFECTS_VOLUME_STORAGE_KEY &&
        key !== null
      ) {
        return;
      }

      const currentStorage = result.trycatch(() => dependencies.storage);

      if (
        !currentStorage.ok ||
        (storageArea !== undefined && storageArea !== currentStorage.value)
      ) {
        return;
      }

      if (key === SOUND_EFFECTS_ENABLED_STORAGE_KEY || key === null) {
        onEnabledChange(loadEnabled());
      }

      if (key === SOUND_EFFECTS_VOLUME_STORAGE_KEY || key === null) {
        onVolumeChange(loadVolume());
      }
    };

    return dependencies.subscribeToStorage(synchronizeAnotherTab);
  };

  return { loadEnabled, loadVolume, saveEnabled, saveVolume, subscribe };
};

export { createSoundEffectsStorage };
