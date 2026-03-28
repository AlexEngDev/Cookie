// TypeScript типы для игры Cookie Evolution

/** Конфигурация стадии эволюции */
export interface Stage {
  id: number;
  name: string;
  emoji: string;
  description: string;
  /** Количество еды, необходимое для эволюции на следующую стадию */
  foodRequired: number;
  /** Пассивный доход еды в секунду */
  passiveIncome: number;
  /** Цвет темы данной стадии */
  color: string;
  /** Количество еды за один клик */
  clickPower: number;
}

/** Состояние игры */
export interface GameState {
  /** Текущее количество еды */
  food: number;
  /** Всего собрано еды за всё время */
  totalFood: number;
  /** Индекс текущей стадии (0-3) */
  currentStage: number;
  /** Количество кликов */
  clickCount: number;
  /** Разблокированные способности */
  abilities: string[];
}

/** Действия игрового стора */
export interface GameActions {
  /** Добавить еду при клике */
  clickFood: () => void;
  /** Перейти на следующую стадию эволюции */
  evolve: () => void;
  /** Добавить пассивную еду */
  addPassiveFood: (amount: number) => void;
  /** Сбросить игру */
  reset: () => void;
  /** Загрузить сохранённое состояние */
  loadSavedState: () => Promise<void>;
}

/** Полный тип стора */
export type GameStore = GameState & GameActions;
