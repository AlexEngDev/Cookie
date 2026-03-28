import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { STAGES } from '../constants/stages';

/**
 * Хук игрового цикла — каждую секунду добавляет пассивный доход еды
 * в зависимости от текущей стадии эволюции.
 */
export const useGameLoop = () => {
  const currentStage = useGameStore((state) => state.currentStage);
  const addPassiveFood = useGameStore((state) => state.addPassiveFood);

  useEffect(() => {
    const stage = STAGES[currentStage];

    // Если нет пассивного дохода — не запускаем интервал
    if (stage.passiveIncome <= 0) return;

    const interval = setInterval(() => {
      addPassiveFood(stage.passiveIncome);
    }, 1000);

    // Очищаем интервал при смене стадии или размонтировании
    return () => clearInterval(interval);
  // addPassiveFood — стабильная функция из Zustand, не нужна в зависимостях
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStage]);
};
