"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@workspace/ui/components/field";
import { Slider } from "@workspace/ui/components/slider";
import { Switch } from "@workspace/ui/components/switch";

import { useSoundEffects } from "@/lib/sound-effects/sound-effects";

interface SoundEffectsFieldProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

interface SoundVolumeFieldProps {
  disabled: boolean;
  onVolumeChange: (volume: number) => void;
  volume: number;
}

interface SoundSettingsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onVolumeChange: (volume: number) => void;
  volume: number;
}

/**
 * Displays the browser-local sound opt-in and its explanatory copy.
 *
 * @param props - The active opt-in and its immediate change intent.
 * @param props.enabled - Whether interface sounds may currently play.
 * @param props.onEnabledChange - Applies and retains a new sound opt-in.
 * @returns The labeled sound-effects switch used by settings.
 */
const SoundEffectsField = ({
  enabled,
  onEnabledChange,
}: SoundEffectsFieldProps) => (
  <Field orientation="horizontal">
    <FieldLabel htmlFor="sound-effects-enabled">
      <FieldContent>
        <FieldTitle>Sound effects</FieldTitle>
        <FieldDescription>
          Play interface sounds while you use this browser.
        </FieldDescription>
      </FieldContent>
    </FieldLabel>
    <Switch
      checked={enabled}
      id="sound-effects-enabled"
      onCheckedChange={onEnabledChange}
    />
  </Field>
);

/**
 * Displays the current sound volume and its immediate preview control.
 *
 * @param props - The current volume, availability, and change intent.
 * @param props.disabled - Prevents changes while interface sounds are off.
 * @param props.onVolumeChange - Applies, previews, and schedules one volume.
 * @param props.volume - Supplies the current integer volume percentage.
 * @returns The labeled volume slider used by settings.
 */
const SoundVolumeField = ({
  disabled,
  onVolumeChange,
  volume,
}: SoundVolumeFieldProps) => (
  <Field className="gap-2" data-disabled={disabled || undefined}>
    <div className="flex items-center justify-between">
      <FieldTitle id="sound-effects-volume-label">Volume</FieldTitle>
      <output
        aria-live="polite"
        className="text-muted-foreground tabular-nums group-data-[disabled=true]/field:opacity-50"
        data-slot="sound-effects-volume-value"
      >
        {volume}%
      </output>
    </div>
    <Slider
      aria-labelledby="sound-effects-volume-label"
      disabled={disabled}
      max={100}
      min={0}
      onValueChange={onVolumeChange}
      step={5}
      value={volume}
    />
  </Field>
);

/**
 * Displays browser-local interface sound preferences.
 *
 * @param props - The current preferences and immediate change intents.
 * @param props.enabled - Whether interface sounds may currently play.
 * @param props.onEnabledChange - Applies a new sound opt-in immediately.
 * @param props.onVolumeChange - Applies and previews a selected volume.
 * @param props.volume - Supplies the current integer volume percentage.
 * @returns The Sound card displayed within application settings.
 */
const SoundSettings = ({
  enabled,
  onEnabledChange,
  onVolumeChange,
  volume,
}: SoundSettingsProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Sound</CardTitle>
      <CardDescription>
        Control interface sounds in this browser.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <FieldGroup>
        <SoundEffectsField
          enabled={enabled}
          onEnabledChange={onEnabledChange}
        />
        <SoundVolumeField
          disabled={!enabled}
          onVolumeChange={onVolumeChange}
          volume={volume}
        />
      </FieldGroup>
    </CardContent>
  </Card>
);

/**
 * Connects the prop-driven Sound card to application-wide sound preferences.
 *
 * @returns Sound settings backed by browser persistence and Cuelume playback.
 */
const SoundSettingsBoundary = () => {
  const soundEffects = useSoundEffects();

  /**
   * Plays the toggle cue on the audible side of each preference transition.
   *
   * @param enabled - Whether future interface sounds may play.
   */
  const changeEnabled = (enabled: boolean) => {
    if (enabled) {
      soundEffects.setEnabled(true);
      soundEffects.play("toggle");
      return;
    }

    soundEffects.play("toggle");
    soundEffects.setEnabled(false);
  };

  /**
   * Applies one selected volume and previews it with Cuelume's tick sound.
   *
   * @param volume - The five-point integer percentage selected by the user.
   */
  const changeVolume = (volume: number) => {
    soundEffects.setVolume(volume);
    soundEffects.play("tick");
  };

  return (
    <SoundSettings
      enabled={soundEffects.enabled}
      onEnabledChange={changeEnabled}
      onVolumeChange={changeVolume}
      volume={soundEffects.volume}
    />
  );
};

export { SoundSettings, SoundSettingsBoundary };
