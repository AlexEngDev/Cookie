// Цветовая палитра игры Cookie Evolution

export const Colors = {
  /** Цвета стадий эволюции */
  stages: {
    /** 🦠 Микроб — зелёный */
    microbe: '#2d6a4f',
    /** 🐟 Существо — синий */
    creature: '#1d3557',
    /** 🦎 Животное — коричневый */
    animal: '#6b4226',
    /** 🧠 Разум — фиолетовый */
    mind: '#4a0e8f',
  },

  /** Основные цвета интерфейса */
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

  /** Цвет полосы прогресса */
  progress: {
    track: 'rgba(255, 255, 255, 0.2)',
    fill: '#f4a261',
  },
} as const;
