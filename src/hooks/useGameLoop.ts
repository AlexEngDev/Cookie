import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { STAGES } from '../constants/stages';

/**
 * Game loop hook — every second it adds passive food income
 * based on the current evolution stage's passiveIncome value.
 */
export const useGameLoop = () => {
  const currentStage = useGameStore((state) => state.currentStage);
  const addPassiveFood = useGameStore((state) => state.addPassiveFood);

  useEffect(() => {
    const stage = STAGES[currentStage];

    // Skip the interval if the current stage has no passive income
    if (stage.passiveIncome <= 0) return;

    const interval = setInterval(() => {
      addPassiveFood(stage.passiveIncome);
    }, 1000);

    // Clean up the interval when the stage changes or the component unmounts
    return () => clearInterval(interval);
  // addPassiveFood is a stable Zustand action and does not need to be listed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage]);
};
