import { Stage } from '../types';

// Конфигурация стадий эволюции

export const STAGES: Stage[] = [
  {
    id: 0,
    name: 'Микроб',
    emoji: '🦠',
    description: 'Начальная форма жизни. Кликай, чтобы собирать еду и выживать!',
    foodRequired: 50,
    passiveIncome: 0,
    color: '#2d6a4f',
    clickPower: 1,
  },
  {
    id: 1,
    name: 'Существо',
    emoji: '🐟',
    description: 'Ты вырос! Теперь еда прибывает пассивно. Продолжай развиваться!',
    foodRequired: 300,
    passiveIncome: 2,
    color: '#1d3557',
    clickPower: 5,
  },
  {
    id: 2,
    name: 'Животное',
    emoji: '🦎',
    description: 'Мощное животное с развитыми инстинктами. Пассивный доход возрастает!',
    foodRequired: 1500,
    passiveIncome: 10,
    color: '#6b4226',
    clickPower: 20,
  },
  {
    id: 3,
    name: 'Разум',
    emoji: '🧠',
    description: 'Высший разум! Ты строишь цивилизацию и управляешь миром.',
    foodRequired: Infinity,
    passiveIncome: 50,
    color: '#4a0e8f',
    clickPower: 100,
  },
];

/** Максимальная стадия (индекс) */
export const MAX_STAGE = STAGES.length - 1;
