import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useGameStore } from '../store/gameStore';

/**
 * Custom hook that provides haptic feedback functions.
 * All feedback is silently skipped when haptics are disabled by the player.
 */
const useHaptics = () => {
  const hapticsEnabled = useGameStore((state) => state.hapticsEnabled);

  /** Light impact — played on creature tap */
  const tapFeedback = useCallback(() => {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [hapticsEnabled]);

  /** Success notification — played on evolution */
  const evolveFeedback = useCallback(() => {
    if (!hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [hapticsEnabled]);

  /** Medium impact — played on upgrade purchase */
  const purchaseFeedback = useCallback(() => {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [hapticsEnabled]);

  /** Success notification — played on achievement unlock */
  const achievementFeedback = useCallback(() => {
    if (!hapticsEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [hapticsEnabled]);

  return { tapFeedback, evolveFeedback, purchaseFeedback, achievementFeedback };
};

export default useHaptics;
