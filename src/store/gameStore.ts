import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameStore, GameState } from '../types';
import { STAGES, MAX_STAGE } from '../constants/stages';

// Ключ для AsyncStorage
const STORAGE_KEY = 'cookie_game_state';

/** Начальное состояние игры */
const initialState: GameState = {
  food: 0,
  totalFood: 0,
  currentStage: 0,
  clickCount: 0,
  abilities: [],
};

/** Сохранить состояние в AsyncStorage */
const saveState = async (state: GameState) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Ошибка сохранения состояния:', e);
  }
};

/** Zustand стор игры */
export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  /** Клик по существу — добавляет еду */
  clickFood: () => {
    const { currentStage, food, totalFood, clickCount } = get();
    const stage = STAGES[currentStage];
    const gained = stage.clickPower;
    const newState = {
      food: food + gained,
      totalFood: totalFood + gained,
      clickCount: clickCount + 1,
    };
    set(newState);
    saveState({ ...get(), ...newState });
  },

  /** Эволюция на следующую стадию */
  evolve: () => {
    const { currentStage, food } = get();
    const stage = STAGES[currentStage];

    // Проверяем, что хватает еды и не достигли максимальной стадии
    if (food < stage.foodRequired || currentStage >= MAX_STAGE) return;

    const newStage = currentStage + 1;
    const newAbilities = [...get().abilities];

    // Разблокировать новые способности при эволюции
    if (newStage === 1) newAbilities.push('passive_income');
    if (newStage === 2) newAbilities.push('fast_hunting');
    if (newStage === 3) newAbilities.push('civilization');

    const newState = {
      food: food - stage.foodRequired,
      currentStage: newStage,
      abilities: newAbilities,
    };
    set(newState);
    saveState({ ...get(), ...newState });
  },

  /** Добавить пассивную еду (вызывается из игрового цикла) */
  addPassiveFood: (amount: number) => {
    const { food, totalFood } = get();
    const newState = {
      food: food + amount,
      totalFood: totalFood + amount,
    };
    set(newState);
    saveState({ ...get(), ...newState });
  },

  /** Сбросить игру до начального состояния */
  reset: () => {
    set(initialState);
    saveState(initialState);
  },

  /** Загрузить сохранённое состояние из AsyncStorage */
  loadSavedState: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: GameState = JSON.parse(saved);
        set(parsed);
      }
    } catch (e) {
      console.warn('Ошибка загрузки состояния:', e);
    }
  },
}));
