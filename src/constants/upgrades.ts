import { Upgrade } from '../types';

// All available upgrades in the Upgrade Shop

export const UPGRADES: Upgrade[] = [
  {
    id: 'better_bait',
    name: 'Better Bait',
    description: '+1 food per click per level.',
    emoji: '🍖',
    baseCost: 10,
    costMultiplier: 1.5,
    maxLevel: 10,
    effect: 'clickPower',
    effectValue: 1,
  },
  {
    id: 'metabolism_boost',
    name: 'Metabolism Boost',
    description: '+0.5 passive food/sec per level.',
    emoji: '⚡',
    baseCost: 25,
    costMultiplier: 1.6,
    maxLevel: 10,
    effect: 'passiveIncome',
    effectValue: 0.5,
  },
  {
    id: 'dna_splice',
    name: 'DNA Splice',
    description: '-5% evolution cost per level.',
    emoji: '🧬',
    baseCost: 50,
    costMultiplier: 2.0,
    maxLevel: 5,
    effect: 'evolutionDiscount',
    effectValue: 0.05,
  },
  {
    id: 'photosynthesis',
    name: 'Photosynthesis',
    description: '+1 passive food/sec per level.',
    emoji: '🌿',
    baseCost: 40,
    costMultiplier: 1.7,
    maxLevel: 8,
    effect: 'passiveIncome',
    effectValue: 1,
  },
  {
    id: 'strong_claws',
    name: 'Strong Claws',
    description: '+2 food per click per level.',
    emoji: '💪',
    baseCost: 60,
    costMultiplier: 1.8,
    maxLevel: 5,
    effect: 'clickPower',
    effectValue: 2,
  },
  {
    id: 'evolution_catalyst',
    name: 'Evolution Catalyst',
    description: '+10% all income per level.',
    emoji: '🔬',
    baseCost: 100,
    costMultiplier: 2.5,
    maxLevel: 3,
    effect: 'allIncome',
    effectValue: 0.1,
  },
];

/**
 * Calculate the food cost for the next level of an upgrade.
 * Cost = baseCost * (costMultiplier ^ currentLevel)
 */
export function getUpgradeCost(upgrade: Upgrade, currentLevel: number): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
}
