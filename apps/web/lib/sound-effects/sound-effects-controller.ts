/**
 * Engine, persistence, and scheduling capabilities consumed by sound state.
 */
type SoundEffectsControllerDependencies = Readonly<{
  applyEnabled: (enabled: boolean) => void;
  applyVolume: (volume: number) => void;
  bind: () => void;
  scheduleVolumeSave: (saveVolume: () => void) => () => void;
  storage: Readonly<{
    loadEnabled: () => boolean;
    loadVolume: () => number;
    saveEnabled: (enabled: boolean) => void;
    saveVolume: (volume: number) => void;
    subscribe: (
      onEnabledChange: (enabled: boolean) => void,
      onVolumeChange: (volume: number) => void
    ) => () => void;
  }>;
}>;

/**
 * The sound state consumed through React's external-store protocol.
 */
type SoundEffectsController = Readonly<{
  getEnabled: () => boolean;
  getVolume: () => number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  subscribe: (listener: () => void) => () => void;
}>;

/**
 * Determines whether a volume belongs to the settings slider's domain.
 *
 * @param volume - The proposed integer percentage.
 * @returns Whether the value is a five-point step from zero through one
 *   hundred.
 */
const isValidVolume = (volume: number) =>
  Number.isInteger(volume) && volume >= 0 && volume <= 100 && volume % 5 === 0;

/**
 * Creates the state owner coordinating Cuelume and browser persistence.
 *
 * @param dependencies - Sound engine, storage, and scheduling capabilities.
 * @returns The external store used by React sound consumers.
 */
const createSoundEffectsController = (
  dependencies: SoundEffectsControllerDependencies
): SoundEffectsController => {
  const listeners = new Set<() => void>();
  let enabled = false;
  let volume = 100;
  let interactionsAreBound = false;
  let cancelScheduledVolumeSave: (() => void) | undefined;
  let unsubscribeFromStorage: (() => void) | undefined;

  dependencies.applyEnabled(enabled);
  dependencies.applyVolume(volume / 100);

  /**
   * Updates both the current snapshot and Cuelume's playback policy.
   *
   * @param nextEnabled - Whether future sound playback is permitted.
   */
  const applyEnabled = (nextEnabled: boolean) => {
    enabled = nextEnabled;
    dependencies.applyEnabled(nextEnabled);
  };

  /**
   * Applies a valid changed volume to both the snapshot and Cuelume.
   *
   * @param nextVolume - The proposed integer percentage.
   * @returns Whether the active volume changed.
   */
  const applyVolume = (nextVolume: number) => {
    if (!isValidVolume(nextVolume) || volume === nextVolume) {
      return false;
    }

    volume = nextVolume;
    dependencies.applyVolume(nextVolume / 100);
    return true;
  };

  /**
   * Announces a completed snapshot change to every React subscriber.
   */
  const notifyChanged = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  /**
   * Returns whether sound playback is currently permitted.
   *
   * @returns The current sound opt-in snapshot.
   */
  const getEnabled = () => enabled;

  /**
   * Returns the current sound volume.
   *
   * @returns The current integer percentage snapshot.
   */
  const getVolume = () => volume;

  /**
   * Restores browser preferences and begins cross-tab synchronization.
   */
  const start = () => {
    unsubscribeFromStorage = dependencies.storage.subscribe(
      (storedEnabled) => {
        applyEnabled(storedEnabled);
        notifyChanged();
      },
      (storedVolume) => {
        if (applyVolume(storedVolume)) {
          notifyChanged();
        }
      }
    );
    applyEnabled(dependencies.storage.loadEnabled());
    applyVolume(dependencies.storage.loadVolume());

    if (!interactionsAreBound) {
      dependencies.bind();
      interactionsAreBound = true;
    }
  };

  /**
   * Starts sound preference restoration for the first React subscriber.
   *
   * @param listener - The React subscriber awaiting snapshot changes.
   * @returns Cleanup for this subscriber.
   */
  const subscribe = (listener: () => void) => {
    if (listeners.size === 0) {
      start();
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);

      if (listeners.size === 0) {
        unsubscribeFromStorage?.();
        unsubscribeFromStorage = undefined;
      }
    };
  };

  /**
   * Applies a sound opt-in immediately and attempts to retain it locally.
   *
   * @param nextEnabled - Whether future interface sounds may play.
   */
  const setEnabled = (nextEnabled: boolean) => {
    applyEnabled(nextEnabled);
    dependencies.storage.saveEnabled(nextEnabled);
    notifyChanged();
  };

  /**
   * Applies a valid volume immediately and retains the latest settled value.
   *
   * @param nextVolume - The five-point integer percentage selected by the user.
   */
  const setVolume = (nextVolume: number) => {
    if (!applyVolume(nextVolume)) {
      return;
    }

    notifyChanged();
    cancelScheduledVolumeSave?.();
    cancelScheduledVolumeSave = dependencies.scheduleVolumeSave(() => {
      cancelScheduledVolumeSave = undefined;

      if (applyVolume(nextVolume)) {
        notifyChanged();
      }

      dependencies.storage.saveVolume(nextVolume);
    });
  };

  return {
    getEnabled,
    getVolume,
    setEnabled,
    setVolume,
    subscribe,
  };
};

export { createSoundEffectsController };
