import { Stage } from '../types';

// Evolution stage configuration

export const STAGES: Stage[] = [
  {
    id: 0,
    name: 'Microbe',
    emoji: '🦠',
    description: 'The earliest form of life. Tap to collect food and survive!',
    foodRequired: 50,
    passiveIncome: 0,
    color: '#2d6a4f',
    clickPower: 1,
  },
  {
    id: 1,
    name: 'Creature',
    emoji: '🐟',
    description: 'You have grown! Food now trickles in passively. Keep evolving!',
    foodRequired: 300,
    passiveIncome: 2,
    color: '#1d3557',
    clickPower: 5,
  },
  {
    id: 2,
    name: 'Animal',
    emoji: '🦎',
    description: 'A powerful animal with sharp instincts. Passive income rises!',
    foodRequired: 1500,
    passiveIncome: 10,
    color: '#6b4226',
    clickPower: 20,
  },
  {
    id: 3,
    name: 'Mind',
    emoji: '🧠',
    description: 'The supreme intellect! You build civilizations and shape the world.',
    foodRequired: Infinity,
    passiveIncome: 50,
    color: '#4a0e8f',
    clickPower: 100,
  },
];

/** Maximum stage index */
export const MAX_STAGE = STAGES.length - 1;
