// Sound hook using expo-av.
// Programmatic audio generation is not supported by expo-av on all platforms,
// so this hook serves as a ready-to-extend placeholder.
// To add real sounds, supply audio file URIs to Audio.Sound.createAsync()
// and call sound.playAsync() inside each function.

/**
 * Custom hook that provides game sound effect functions.
 * Haptic feedback (useHaptics) is the primary tactile feedback mechanism;
 * sounds are an optional enhancement.
 *
 * @returns {{
 *   playClick: () => void,
 *   playEvolve: () => void,
 *   playBuy: () => void,
 *   playAchievement: () => void
 * }}
 */
const useSounds = () => {
  /** Played on creature tap */
  const playClick = () => {
    // Extend: load and play a short click sound via expo-av
  };

  /** Played on evolution */
  const playEvolve = () => {
    // Extend: load and play an evolution chime via expo-av
  };

  /** Played on upgrade purchase */
  const playBuy = () => {
    // Extend: load and play a purchase sound via expo-av
  };

  /** Played on achievement unlock */
  const playAchievement = () => {
    // Extend: load and play an achievement fanfare via expo-av
  };

  return { playClick, playEvolve, playBuy, playAchievement };
};

export default useSounds;
