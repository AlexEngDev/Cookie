import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface ResourcePanelProps {
  /** Current food amount */
  food: number;
  /** Total food ever collected */
  totalFood: number;
  /** Passive income per second */
  passiveIncome: number;
  /** Number of taps */
  clickCount: number;
}

/**
 * Resource panel — shows current food, passive income rate,
 * and overall game statistics.
 */
const ResourcePanel: React.FC<ResourcePanelProps> = ({
  food,
  totalFood,
  passiveIncome,
  clickCount,
}) => {
  return (
    <View style={styles.container}>
      {/* Main food counter */}
      <View style={styles.mainResource}>
        <Text style={styles.foodEmoji}>🍖</Text>
        <Text style={styles.foodCount}>{Math.floor(food)}</Text>
        <Text style={styles.foodLabel}>food</Text>
      </View>

      {/* Secondary stats */}
      <View style={styles.stats}>
        {passiveIncome > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>+{passiveIncome}/sec</Text>
            <Text style={styles.statLabel}>passive</Text>
          </View>
        )}
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{clickCount}</Text>
          <Text style={styles.statLabel}>taps</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.floor(totalFood)}</Text>
          <Text style={styles.statLabel}>total</Text>
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
