// Color palette for the Cookie Evolution game

export const Colors = {
  /** Evolution stage theme colours */
  stages: {
    /** 🦠 Microbe — green */
    microbe: '#2d6a4f',
    /** 🐟 Creature — blue */
    creature: '#1d3557',
    /** 🦎 Animal — brown */
    animal: '#6b4226',
    /** 🧠 Mind — purple */
    mind: '#4a0e8f',
  },

  /** Core UI colours */
  ui: {
    background: '#1a1a2e',
    card: 'rgba(255, 255, 255, 0.1)',
    cardBorder: 'rgba(255, 255, 255, 0.2)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    accent: '#f4a261',
    danger: '#e63946',
    success: '#2a9d8f',
  },

  /** Progress bar colours */
  progress: {
    track: 'rgba(255, 255, 255, 0.2)',
    fill: '#f4a261',
  },
} as const;
