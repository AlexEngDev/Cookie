// TypeScript types for the Cookie Evolution game

/** Achievement definition */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: {
    type: 'totalFood' | 'clickCount' | 'stage' | 'upgradeLevel' | 'totalUpgrades';
    value: number;
    /** Used only when type is 'upgradeLevel' to specify which upgrade */
    upgradeId?: string;
  };
  reward: {
    type: 'clickMultiplier' | 'passiveMultiplier' | 'foodBonus';
    value: number;
  };
}

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
  /** Theme colour for this stage (reflects the biome) */
  color: string;
  /** Food earned per click */
  clickPower: number;
  /** Emojis used for collectible food items in this biome */
  foodEmojis: string[];
  /** Emojis used for prey AI entities in this biome */
  preyEmojis: string[];
  /** Emojis used for predator AI entities in this biome */
  predatorEmojis: string[];
  /** Emojis used for static world decorations in this biome */
  decorationEmojis: string[];
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

/** Mutation levels for the creature editor */
export interface Mutations {
  /** Flagella/Fins — increases movement speed */
  speedLevel: number;
  /** Spikes — reduces food lost when hit by a predator */
  spikesLevel: number;
  /** Jaws — increases food collection radius and bonus food per item */
  jawsLevel: number;
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
  /** List of unlocked achievement IDs */
  unlockedAchievements: string[];
  /** Whether haptic feedback is enabled (toggled by the mute button) */
  hapticsEnabled: boolean;
  /** Purchased mutation levels (creature editor) */
  mutations: Mutations;
  /**
   * Diet score: -100 = pure herbivore, 0 = omnivore, +100 = pure carnivore.
   * Decreases when eating plants, increases when eating meat/prey.
   */
  dietScore: number;
  /** Maximum number of health points (hearts) */
  maxHealth: number;
  /** Current health points remaining */
  currentHealth: number;
  /** Increments each time the player dies — used to trigger the death overlay */
  deathCount: number;
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
  /** Check and unlock any newly earned achievements */
  checkAchievements: () => void;
  /** Reset the game to its initial state */
  reset: () => void;
  /** Load previously saved game state from AsyncStorage */
  loadSavedState: () => Promise<void>;
  /** Toggle haptic feedback on or off */
  toggleHaptics: () => void;
  /** Deduct food when hit by a predator (food cannot go below 0) */
  loseFood: (amount: number) => void;
  /**
   * Purchase one level of a mutation.
   * Deducts `cost` from food and increments the respective mutation level.
   */
  buyMutation: (type: 'speed' | 'spikes' | 'jaws', cost: number) => void;
  /**
   * Record that the player ate a food item of the given type.
   * 'plant' shifts the diet toward Herbivore (-5), 'meat' toward Carnivore (+5).
   * Score is capped at [-100, 100].
   */
  eatFoodType: (type: 'plant' | 'meat') => void;
  /**
   * Deduct health when the player is damaged.
   * If health reaches 0, `die()` is called automatically.
   * @param amount Number of hearts to remove (default 1).
   */
  takeDamage: (amount?: number) => void;
  /**
   * Restore health points, capped at `maxHealth`.
   * No-op if already at full health.
   * @param amount Number of hearts to restore (default 1).
   */
  heal: (amount?: number) => void;
  /**
   * Handle player death: lose 25 % of current food and reset health to `maxHealth`.
   * Also increments `deathCount` so the UI can show the death overlay.
   */
  die: () => void;
}

/** Full store type (state + actions) */
export type GameStore = GameState & GameActions;
