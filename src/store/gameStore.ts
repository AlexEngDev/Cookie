import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameStore, GameState } from '../types';
import { STAGES, MAX_STAGE } from '../constants/stages';
import { UPGRADES, getUpgradeCost } from '../constants/upgrades';

// AsyncStorage key for persisting game state
const STORAGE_KEY = 'cookie_game_state';

/** Default starting state for a new game */
const initialState: GameState = {
  food: 0,
  totalFood: 0,
  currentStage: 0,
  clickCount: 0,
  abilities: [],
  upgrades: {},
};

/** Persist the game state to AsyncStorage */
const saveState = async (state: GameState) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save game state:', e);
  }
};

/**
 * Calculate the total click power bonus from purchased upgrades.
 * Includes the allIncome multiplier.
 */
function calcClickBonus(upgrades: Record<string, number>): number {
  let bonus = 0;
  let allIncomeMultiplier = 1;

  for (const upgrade of UPGRADES) {
    const level = upgrades[upgrade.id] ?? 0;
    if (level === 0) continue;

    if (upgrade.effect === 'clickPower') {
      bonus += upgrade.effectValue * level;
    } else if (upgrade.effect === 'allIncome') {
      allIncomeMultiplier += upgrade.effectValue * level;
    }
  }

  return bonus * allIncomeMultiplier;
}

/** Zustand game store */
export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  /** Tap the creature — awards food based on current stage click power plus upgrades */
  clickFood: () => {
    const { currentStage, food, totalFood, clickCount, upgrades } = get();
    const stage = STAGES[currentStage];
    const gained = stage.clickPower + calcClickBonus(upgrades);
    const newState = {
      food: food + gained,
      totalFood: totalFood + gained,
      clickCount: clickCount + 1,
    };
    set(newState);
    saveState({ ...get(), ...newState });
  },

  /** Advance to the next evolution stage, applying any evolution discount upgrades */
  evolve: () => {
    const { currentStage, food, upgrades } = get();
    const stage = STAGES[currentStage];

    // Calculate discount from DNA Splice upgrade
    const discountLevel = upgrades['dna_splice'] ?? 0;
    const discount = UPGRADES.find((u) => u.id === 'dna_splice')?.effectValue ?? 0;
    const costMultiplier = Math.max(0, 1 - discount * discountLevel);
    const effectiveCost = Math.floor(stage.foodRequired * costMultiplier);

    // Ensure the player has enough food and hasn't already reached the final stage
    if (food < effectiveCost || currentStage >= MAX_STAGE) return;

    const newStage = currentStage + 1;
    const newAbilities = [...get().abilities];

    // Unlock new abilities when evolving
    if (newStage === 1) newAbilities.push('passive_income');
    if (newStage === 2) newAbilities.push('fast_hunting');
    if (newStage === 3) newAbilities.push('civilization');

    const newState = {
      food: food - effectiveCost,
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

  /** Purchase one level of the specified upgrade if affordable */
  buyUpgrade: (upgradeId: string) => {
    const { food, upgrades } = get();
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade) return;

    const currentLevel = upgrades[upgradeId] ?? 0;
    if (currentLevel >= upgrade.maxLevel) return;

    const cost = getUpgradeCost(upgrade, currentLevel);
    if (food < cost) return;

    const newUpgrades = { ...upgrades, [upgradeId]: currentLevel + 1 };
    const newState = { food: food - cost, upgrades: newUpgrades };
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
        // Ensure upgrades field exists for saves created before this update
        if (!parsed.upgrades) parsed.upgrades = {};
        set(parsed);
      }
    } catch (e) {
      console.warn('Failed to load saved game state:', e);
    }
  },
}));
