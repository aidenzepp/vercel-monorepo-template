"use client";

import {
  bind,
  play as playCuelume,
  setEnabled as setCuelumeEnabled,
  setVolume as setCuelumeVolume,
} from "cuelume";
import {
  createContext,
  createElement,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";

import { createSoundEffectsController } from "./sound-effects-controller";
import { createSoundEffectsStorage } from "./sound-effects-storage";

/**
 * The trailing interval that coalesces rapid volume changes into one write.
 */
const SOUND_EFFECTS_VOLUME_SAVE_DELAY_MS = 200;

/**
 * The sound preference and playback capabilities exposed to React consumers.
 */
type SoundEffects = Readonly<{
  /**
   * Whether interface sounds may play in the current browser tab.
   */
  enabled: boolean;
  /**
   * Plays one Cuelume sound under the active enabled and volume preferences.
   *
   * @param sound - The named sound recipe, defaulting to Cuelume's chime.
   */
  play: (sound?: Parameters<typeof playCuelume>[0]) => void;
  /**
   * Applies and attempts to retain the sound opt-in.
   *
   * @param enabled - Whether future interface sounds may play.
   */
  setEnabled: (enabled: boolean) => void;
  /**
   * Applies a five-point volume percentage and retains it after input settles.
   *
   * @param volume - The integer percentage selected in sound settings.
   */
  setVolume: (volume: number) => void;
  /**
   * The current sound volume as an integer percentage.
   */
  volume: number;
}>;

/**
 * Carries sound preferences through the client component tree.
 */
const SoundEffectsContext = createContext<SoundEffects | undefined>(undefined);

/**
 * Plays one sound through the application-owned Cuelume boundary.
 *
 * @param sound - The named recipe requested by an application interaction.
 * @see https://www.npmjs.com/package/cuelume/v/0.2.2
 */
const play = (sound?: Parameters<typeof playCuelume>[0]) => {
  playCuelume(sound);
};

/**
 * The browser storage adapter shared by every provider instance in this tab.
 */
const soundEffectsStorage = createSoundEffectsStorage({
  get storage() {
    return window.localStorage;
  },
  subscribeToStorage: (onStorageChange) => {
    /**
     * Forwards one cross-tab storage signal to the preference adapter.
     *
     * @param event - The browser event identifying the changed storage area.
     */
    const synchronizeAnotherTab = (event: StorageEvent) => {
      onStorageChange(event.key, event.newValue, event.storageArea);
    };

    window.addEventListener("storage", synchronizeAnotherTab);

    return () => {
      window.removeEventListener("storage", synchronizeAnotherTab);
    };
  },
});

/**
 * The process-local state owner shared by all sound consumers in this tab.
 */
const soundEffectsController = createSoundEffectsController({
  applyEnabled: setCuelumeEnabled,
  applyVolume: setCuelumeVolume,
  bind,
  scheduleVolumeSave: (saveVolume) => {
    const timeoutId = window.setTimeout(
      saveVolume,
      SOUND_EFFECTS_VOLUME_SAVE_DELAY_MS
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  },
  storage: soundEffectsStorage,
});

/**
 * Returns the opt-in snapshot used for hydration-safe server rendering.
 *
 * @returns Disabled until browser storage can be restored.
 */
const readServerSoundEffects = () => false;

/**
 * Returns the volume snapshot used for hydration-safe server rendering.
 *
 * @returns Full volume until browser storage can be restored.
 */
const readServerSoundEffectsVolume = () => 100;

type SoundEffectsProviderProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Provides persistent sound preferences and playback to application consumers.
 *
 * Server-rendered descendants remain server components as they pass through
 * this client boundary.
 *
 * @param props - The application subtree consuming sound capabilities.
 * @param props.children - Supplies the active route and global application UI.
 * @returns The subtree connected to hydration-safe sound preferences.
 */
const SoundEffectsProvider = ({ children }: SoundEffectsProviderProps) => {
  const enabled = useSyncExternalStore(
    soundEffectsController.subscribe,
    soundEffectsController.getEnabled,
    readServerSoundEffects
  );
  const volume = useSyncExternalStore(
    soundEffectsController.subscribe,
    soundEffectsController.getVolume,
    readServerSoundEffectsVolume
  );
  const soundEffects = useMemo(
    () => ({
      enabled,
      play,
      setEnabled: soundEffectsController.setEnabled,
      setVolume: soundEffectsController.setVolume,
      volume,
    }),
    [enabled, volume]
  );

  return createElement(
    SoundEffectsContext.Provider,
    { value: soundEffects },
    children
  );
};

/**
 * Returns the sound preference and playback capabilities for the current app.
 *
 * @returns The sound state supplied by the root provider.
 * @throws {Error} When called outside the application sound provider.
 */
const useSoundEffects = (): SoundEffects => {
  const soundEffects = useContext(SoundEffectsContext);

  if (soundEffects === undefined) {
    throw new Error("useSoundEffects must be used within SoundEffectsProvider");
  }

  return soundEffects;
};

export { SoundEffectsProvider, useSoundEffects };
