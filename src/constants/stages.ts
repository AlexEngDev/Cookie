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
    // Deep ocean blue — underwater biome
    color: '#1565a0',
    clickPower: 1,
    foodEmojis: ['🍖', '🌿', '🫐'],
    preyEmojis: ['🦐', '🐛', '🦠'],
    predatorEmojis: ['🦑', '🦀', '🦈'],
    decorationEmojis: ['🫧', '🪨'],
  },
  {
    id: 1,
    name: 'Creature',
    emoji: '🐟',
    description: 'You have grown! Food now trickles in passively. Keep evolving!',
    foodRequired: 300,
    passiveIncome: 2,
    // Teal — shallow coastal waters biome
    color: '#0e7c61',
    clickPower: 5,
    foodEmojis: ['🐚', '🌿', '🪸'],
    preyEmojis: ['🐠', '🐡', '🦐'],
    predatorEmojis: ['🐙', '🦭', '🐊'],
    decorationEmojis: ['🌊', '🪨', '🌿'],
  },
  {
    id: 2,
    name: 'Animal',
    emoji: '🦎',
    description: 'A powerful animal with sharp instincts. Passive income rises!',
    foodRequired: 1500,
    passiveIncome: 10,
    // Forest green — grassland/land biome
    color: '#2d6a2f',
    clickPower: 20,
    foodEmojis: ['🍎', '🍄', '🥩'],
    preyEmojis: ['🐀', '🐇', '🦔'],
    predatorEmojis: ['🐺', '🐅', '🦖'],
    decorationEmojis: ['🌲', '🌳', '🪨'],
  },
  {
    id: 3,
    name: 'Mind',
    emoji: '🧠',
    description: 'The supreme intellect! You build civilizations and shape the world.',
    foodRequired: Infinity,
    passiveIncome: 50,
    // Deep purple — civilization/modern biome
    color: '#4a0e8f',
    clickPower: 100,
    foodEmojis: ['🍞', '🥕', '🍗'],
    preyEmojis: ['🐑', '🐄', '🐖'],
    predatorEmojis: ['🤖', '🛡️', '⚔️'],
    decorationEmojis: ['🏠', '🌳', '⛽'],
  },
];

/** Maximum stage index */
export const MAX_STAGE = STAGES.length - 1;
