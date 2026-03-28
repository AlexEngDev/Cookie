import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameStore, GameState } from '../types';
import { STAGES, MAX_STAGE } from '../constants/stages';

// AsyncStorage key for persisting game state
const STORAGE_KEY = 'cookie_game_state';

/** Default starting state for a new game */
const initialState: GameState = {
  food: 0,
  totalFood: 0,
  currentStage: 0,
  clickCount: 0,
  abilities: [],
};

/** Persist the game state to AsyncStorage */
const saveState = async (state: GameState) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save game state:', e);
  }
};

/** Zustand game store */
export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  /** Tap the creature — awards food based on current stage click power */
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

  /** Advance to the next evolution stage */
  evolve: () => {
    const { currentStage, food } = get();
    const stage = STAGES[currentStage];

    // Ensure the player has enough food and hasn't already reached the final stage
    if (food < stage.foodRequired || currentStage >= MAX_STAGE) return;

    const newStage = currentStage + 1;
    const newAbilities = [...get().abilities];

    // Unlock new abilities when evolving
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

  /** Add passive food income (called by the game loop hook) */
  addPassiveFood: (amount: number) => {
    const { food, totalFood } = get();
    const newState = {
      food: food + amount,
      totalFood: totalFood + amount,
    };
    set(newState);
    saveState({ ...get(), ...newState });
  },

  /** Reset the game back to its initial state */
  reset: () => {
    set(initialState);
    saveState(initialState);
  },

  /** Load previously saved game state from AsyncStorage */
  loadSavedState: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: GameState = JSON.parse(saved);
        set(parsed);
      }
    } catch (e) {
      console.warn('Failed to load saved game state:', e);
    }
  },
}));
