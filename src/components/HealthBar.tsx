import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface HealthBarProps {
  /** Current number of hearts remaining */
  currentHealth: number;
  /** Maximum number of hearts */
  maxHealth: number;
}

/**
 * Health bar HUD — renders a row of heart icons showing current / max HP.
 * Filled hearts (❤️) for remaining health, empty hearts (🖤) for lost HP.
 */
const HealthBar: React.FC<HealthBarProps> = ({ currentHealth, maxHealth }) => {
  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: maxHealth }, (_, i) => (
        <Text key={i} style={styles.heart}>
          {i < currentHealth ? '❤️' : '🖤'}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 20,
    gap: 6,
    backgroundColor: Colors.ui.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.ui.cardBorder,
    marginHorizontal: 16,
  },
  heart: {
    fontSize: 22,
  },
});

export default HealthBar;
