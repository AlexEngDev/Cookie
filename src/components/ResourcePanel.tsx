import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface ResourcePanelProps {
  /** Текущее количество еды */
  food: number;
  /** Всего собрано еды */
  totalFood: number;
  /** Пассивный доход в секунду */
  passiveIncome: number;
  /** Количество кликов */
  clickCount: number;
}

/**
 * Панель ресурсов — отображает текущую еду, пассивный доход
 * и общую статистику игры.
 */
const ResourcePanel: React.FC<ResourcePanelProps> = ({
  food,
  totalFood,
  passiveIncome,
  clickCount,
}) => {
  return (
    <View style={styles.container}>
      {/* Основной счётчик еды */}
      <View style={styles.mainResource}>
        <Text style={styles.foodEmoji}>🍖</Text>
        <Text style={styles.foodCount}>{Math.floor(food)}</Text>
        <Text style={styles.foodLabel}>еды</Text>
      </View>

      {/* Дополнительная статистика */}
      <View style={styles.stats}>
        {passiveIncome > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>+{passiveIncome}/сек</Text>
            <Text style={styles.statLabel}>пассивно</Text>
          </View>
        )}
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{clickCount}</Text>
          <Text style={styles.statLabel}>кликов</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.floor(totalFood)}</Text>
          <Text style={styles.statLabel}>всего</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.ui.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.ui.cardBorder,
    marginHorizontal: 16,
  },
  mainResource: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  foodEmoji: {
    fontSize: 24,
  },
  foodCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.ui.text,
  },
  foodLabel: {
    fontSize: 16,
    color: Colors.ui.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ui.accent,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.ui.textSecondary,
  },
});

export default ResourcePanel;
