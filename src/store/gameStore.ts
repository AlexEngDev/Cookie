import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameStore, GameState } from '../types';
import { STAGES, MAX_STAGE } from '../constants/stages';
import { UPGRADES, getUpgradeCost } from '../constants/upgrades';
import { ACHIEVEMENTS } from '../constants/achievements';

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
  unlockedAchievements: [],
  hapticsEnabled: true,
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

/**
 * Calculate the total click multiplier bonus from unlocked achievements.
 * Returns a multiplier value (e.g. 0.15 means +15%).
 */
function calcAchievementClickMultiplier(unlockedAchievements: string[]): number {
  let multiplier = 0;
  for (const achievement of ACHIEVEMENTS) {
    if (unlockedAchievements.includes(achievement.id) && achievement.reward.type === 'clickMultiplier') {
      multiplier += achievement.reward.value;
    }
  }
  return multiplier;
}

/**
 * Calculate the total passive income multiplier bonus from unlocked achievements.
 * Returns a multiplier value (e.g. 0.1 means +10%).
 */
function calcAchievementPassiveMultiplier(unlockedAchievements: string[]): number {
  let multiplier = 0;
  for (const achievement of ACHIEVEMENTS) {
    if (unlockedAchievements.includes(achievement.id) && achievement.reward.type === 'passiveMultiplier') {
      multiplier += achievement.reward.value;
    }
  }
  return multiplier;
}

/**
 * Calculate the total flat food bonus from unlocked achievements.
 */
function calcAchievementFoodBonus(unlockedAchievements: string[]): number {
  let bonus = 0;
  for (const achievement of ACHIEVEMENTS) {
    if (unlockedAchievements.includes(achievement.id) && achievement.reward.type === 'foodBonus') {
      bonus += achievement.reward.value;
    }
  }
  return bonus;
}

/**
 * Return the count of total upgrade levels purchased across all upgrades.
 */
function countTotalUpgrades(upgrades: Record<string, number>): number {
  return Object.values(upgrades).reduce((sum, level) => sum + level, 0);
}

/** Zustand game store */
export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  /** Tap the creature — awards food based on current stage click power plus upgrades and achievement bonuses */
  clickFood: () => {
    const { currentStage, food, totalFood, clickCount, upgrades, unlockedAchievements } = get();
    const stage = STAGES[currentStage];
    const upgradeBonus = calcClickBonus(upgrades);
    const achievementClickMult = calcAchievementClickMultiplier(unlockedAchievements);
    const achievementFoodBonus = calcAchievementFoodBonus(unlockedAchievements);
    const baseGain = stage.clickPower + upgradeBonus + achievementFoodBonus;
    const gained = baseGain * (1 + achievementClickMult);
    const newState = {
      food: food + gained,
      totalFood: totalFood + gained,
      clickCount: clickCount + 1,
    };
    set(newState);
    saveState({ ...get(), ...newState });
    get().checkAchievements();
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
    get().checkAchievements();
  },

  /** Add passive food income (called by the game loop hook) */
  addPassiveFood: (amount: number) => {
    const { food, totalFood, unlockedAchievements } = get();
    const achievementPassiveMult = calcAchievementPassiveMultiplier(unlockedAchievements);
    const gained = amount * (1 + achievementPassiveMult);
    const newState = {
      food: food + gained,
      totalFood: totalFood + gained,
    };
    set(newState);
    saveState({ ...get(), ...newState });
    get().checkAchievements();
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

  /** Check all achievements and unlock any whose conditions are now met */
  checkAchievements: () => {
    const { totalFood, clickCount, currentStage, upgrades, unlockedAchievements } = get();
    const totalUpgrades = countTotalUpgrades(upgrades);
    const newlyUnlocked: string[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedAchievements.includes(achievement.id)) continue;

      const { type, value, upgradeId } = achievement.condition;
      let conditionMet = false;

      if (type === 'totalFood') {
        conditionMet = totalFood >= value;
      } else if (type === 'clickCount') {
        conditionMet = clickCount >= value;
      } else if (type === 'stage') {
        conditionMet = currentStage >= value;
      } else if (type === 'totalUpgrades') {
        conditionMet = totalUpgrades >= value;
      } else if (type === 'upgradeLevel' && upgradeId) {
        conditionMet = (upgrades[upgradeId] ?? 0) >= value;
      }

      if (conditionMet) {
        newlyUnlocked.push(achievement.id);
      }
    }

    if (newlyUnlocked.length > 0) {
      const updated = [...unlockedAchievements, ...newlyUnlocked];
      set({ unlockedAchievements: updated });
      saveState({ ...get(), unlockedAchievements: updated });
    }
  },

  /** Reset the game back to its initial state */
  reset: () => {
    set(initialState);
    saveState(initialState);
  },

  /** Toggle haptic feedback on / off and persist the preference */
  toggleHaptics: () => {
    const { hapticsEnabled } = get();
    const newState = { hapticsEnabled: !hapticsEnabled };
    set(newState);
    saveState({ ...get(), ...newState });
  },

  /** Deduct food when the player is hit by a predator — food cannot go below 0 */
  loseFood: (amount: number) => {
    const { food } = get();
    const newState = { food: Math.max(0, food - amount) };
    set(newState);
    saveState({ ...get(), ...newState });
  },

  /** Load previously saved game state from AsyncStorage */
  loadSavedState: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: GameState = JSON.parse(saved);
        // Ensure upgrades field exists for saves created before this update
        if (!parsed.upgrades) parsed.upgrades = {};
        // Ensure unlockedAchievements field exists for older saves
        if (!parsed.unlockedAchievements) parsed.unlockedAchievements = [];
        // Ensure hapticsEnabled exists for older saves (default: true)
        if (parsed.hapticsEnabled === undefined) parsed.hapticsEnabled = true;
        set(parsed);
      }
    } catch (e) {
      console.warn('Failed to load saved game state:', e);
    }
  },
}));
