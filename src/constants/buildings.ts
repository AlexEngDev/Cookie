/** Configuration for a civilization building in the "Mind" stage (stage 3) */
export interface Building {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Emoji icon */
  emoji: string;
  /** Short description */
  description: string;
  /** Food cost for level 1 */
  baseCost: number;
  /** Cost multiplier applied per level */
  costMultiplier: number;
  /** Passive food income per second added per level */
  incomePerLevel: number;
  /** Maximum purchasable level */
  maxLevel: number;
}

/** All available civilization buildings */
export const BUILDINGS: Building[] = [
  {
    id: 'farm',
    name: 'Ферма',
    emoji: '🌾',
    description: '+5 passive food/sec per level.',
    baseCost: 200,
    costMultiplier: 1.5,
    incomePerLevel: 5,
    maxLevel: 10,
  },
  {
    id: 'market',
    name: 'Рынок',
    emoji: '🏪',
    description: '+20 passive food/sec per level.',
    baseCost: 800,
    costMultiplier: 1.6,
    incomePerLevel: 20,
    maxLevel: 8,
  },
  {
    id: 'factory',
    name: 'Завод',
    emoji: '🏭',
    description: '+80 passive food/sec per level.',
    baseCost: 3000,
    costMultiplier: 1.7,
    incomePerLevel: 80,
    maxLevel: 5,
  },
  {
    id: 'lab',
    name: 'Лаборатория',
    emoji: '🔬',
    description: '+300 passive food/sec per level.',
    baseCost: 10000,
    costMultiplier: 1.8,
    incomePerLevel: 300,
    maxLevel: 3,
  },
];

/**
 * Calculate the food cost for the next level of a building.
 * Cost = baseCost * (costMultiplier ^ currentLevel)
 */
export function getBuildingCost(building: Building, currentLevel: number): number {
  return Math.floor(building.baseCost * Math.pow(building.costMultiplier, currentLevel));
}

/**
 * Calculate the total passive food income per second from all purchased buildings.
 * @param buildings - Map of { [buildingId]: level }
 */
export function calcTotalBuildingIncome(buildings: Record<string, number>): number {
  let total = 0;
  for (const building of BUILDINGS) {
    const level = buildings[building.id] ?? 0;
    total += building.incomePerLevel * level;
  }
  return total;
}
