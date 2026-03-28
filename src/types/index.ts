// TypeScript types for the Cookie Evolution game

/** Evolution stage configuration */
export interface Stage {
  id: number;
  name: string;
  emoji: string;
  description: string;
  /** Amount of food required to evolve to the next stage */
  foodRequired: number;
  /** Passive food income per second */
  passiveIncome: number;
  /** Theme colour for this stage */
  color: string;
  /** Food earned per click */
  clickPower: number;
}

/** Shop upgrade configuration */
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Food cost for level 1 */
  baseCost: number;
  /** Cost multiplier applied per level (e.g. 1.5) */
  costMultiplier: number;
  /** Maximum purchasable level */
  maxLevel: number;
  /** Which game mechanic this upgrade affects */
  effect: 'clickPower' | 'passiveIncome' | 'evolutionDiscount' | 'allIncome';
  /** Bonus added (or multiplied) per level */
  effectValue: number;
}

/** Game state */
export interface GameState {
  /** Current food amount */
  food: number;
  /** Total food ever collected */
  totalFood: number;
  /** Index of the current evolution stage (0-3) */
  currentStage: number;
  /** Number of taps performed */
  clickCount: number;
  /** Unlocked abilities */
  abilities: string[];
  /** Purchased upgrade levels, keyed by upgrade id */
  upgrades: Record<string, number>;
}

/** Game store actions */
export interface GameActions {
  /** Award food on tap, factoring in purchased upgrades */
  clickFood: () => void;
  /** Advance to the next evolution stage */
  evolve: () => void;
  /** Add passive food income (called by the game loop) */
  addPassiveFood: (amount: number) => void;
  /** Purchase one level of an upgrade */
  buyUpgrade: (upgradeId: string) => void;
  /** Reset the game to its initial state */
  reset: () => void;
  /** Load previously saved game state from AsyncStorage */
  loadSavedState: () => Promise<void>;
}

/** Full store type (state + actions) */
export type GameStore = GameState & GameActions;
