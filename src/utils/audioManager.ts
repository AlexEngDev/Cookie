/**
 * audioManager.ts
 *
 * Centralised sound-effect helper for the Cookie game.
 *
 * Architecture
 * ────────────
 * Each named sound is loaded lazily on first play and cached so that
 * subsequent plays only call `replayAsync()` without re-loading the asset.
 *
 * NOTE ON ASSETS
 * ──────────────
 * Actual `.mp3` / `.wav` files are not yet included in the repository.
 * Replace the `TODO` placeholders below with `require('../../assets/sounds/eat.mp3')`
 * (or equivalent) once the files are added to the project.
 */

import { Audio } from 'expo-av';

// ─── Sound registry ───────────────────────────────────────────────────────────

/**
 * Enumeration of every named sound effect used by the game.
 * Adding a new sound only requires adding a key here and a matching entry in
 * SOUND_SOURCES below.
 */
export type SoundKey = 'eat' | 'eatPrey' | 'damage' | 'dash';

/**
 * Map from SoundKey → asset source.
 *
 * Replace each `null` with the actual asset once you have the files:
 *   require('../../assets/sounds/eat.mp3')
 */
const SOUND_SOURCES: Record<SoundKey, Parameters<typeof Audio.Sound.createAsync>[0] | null> = {
  // TODO: replace with require('../../assets/sounds/eat.mp3')
  eat: null,
  // TODO: replace with require('../../assets/sounds/eat_prey.mp3')
  eatPrey: null,
  // TODO: replace with require('../../assets/sounds/damage.mp3')
  damage: null,
  // TODO: replace with require('../../assets/sounds/dash.mp3')
  dash: null,
};

/** Cache of loaded Sound objects so we avoid reloading the same file repeatedly */
const soundCache: Partial<Record<SoundKey, Audio.Sound>> = {};

/**
 * Play the specified sound effect.
 *
 * • If the asset source is `null` the call is a no-op (logs a reminder in dev).
 * • Loads the asset on first call and caches the Sound object for reuse.
 * • Rewinds to the beginning before playing so rapid successive calls work correctly.
 * • Errors are caught and logged so a missing asset never crashes the game.
 */
export async function playSound(key: SoundKey): Promise<void> {
  const source = SOUND_SOURCES[key];

  if (source === null) {
    // TODO: Add local asset for this sound key
    return;
  }

  try {
    let sound = soundCache[key];

    if (!sound) {
      const { sound: newSound } = await Audio.Sound.createAsync(source, { shouldPlay: false });
      soundCache[key] = newSound;
      sound = newSound;
    }

    // Rewind so rapid plays always start from the beginning
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (err) {
    console.warn(`[audioManager] Failed to play sound "${key}":`, err);
  }
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

/** Short crunch sound when the player eats a food item / plant */
export const playEatSound = (): Promise<void> => playSound('eat');

/** Satisfying chomp sound when the player eats a prey entity */
export const playEatPreySound = (): Promise<void> => playSound('eatPrey');

/** Impact / hurt sound when a predator damages the player */
export const playDamageSound = (): Promise<void> => playSound('damage');

/** Whoosh sound when the player activates the dash ability */
export const playDashSound = (): Promise<void> => playSound('dash');

/**
 * Release all cached sounds and free native audio resources.
 * Call this when the game screen unmounts or the app goes to the background.
 */
export async function unloadAllSounds(): Promise<void> {
  await Promise.all(
    (Object.keys(soundCache) as SoundKey[]).map(async (key) => {
      try {
        await soundCache[key]?.unloadAsync();
        soundCache[key] = undefined;
      } catch {
        // Ignore unload errors
      }
    }),
  );
}
