import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DietBarProps {
  /** Current diet score: -100 (Herbivore) to +100 (Carnivore) */
  dietScore: number;
}

/**
 * Horizontal diet scale displayed in the HUD.
 * Left (green) = Herbivore, Centre = Omnivore, Right (red) = Carnivore.
 */
const DietBar: React.FC<DietBarProps> = ({ dietScore }) => {
  // Convert score [-100, 100] to a fraction [0, 1] for the indicator position
  const fraction = (dietScore + 100) / 200;

  let label: string;
  let labelEmoji: string;
  if (dietScore < -30) {
    label = 'Herbivore';
    labelEmoji = '🌿';
  } else if (dietScore > 30) {
    label = 'Carnivore';
    labelEmoji = '🍖';
  } else {
    label = 'Omnivore';
    labelEmoji = '⚖️';
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {labelEmoji} {label}
      </Text>
      <View style={styles.track}>
        {/* Gradient-like fill: green left half, red right half */}
        <View style={[styles.fill, styles.fillLeft]} />
        <View style={[styles.fill, styles.fillRight]} />
        {/* Indicator dot positioned along the track */}
        <View style={[styles.indicator, { left: `${fraction * 100}%` }]} />
      </View>
      <View style={styles.ends}>
        <Text style={styles.endLabel}>🌿</Text>
        <Text style={styles.endLabel}>🍖</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontWeight: '600',
  },
  track: {
    height: 14,
    borderRadius: 4,
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  fill: {
    flex: 1,
    height: 8,
  },
  fillLeft: {
    backgroundColor: 'rgba(80,200,80,0.7)',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  fillRight: {
    backgroundColor: 'rgba(220,60,60,0.7)',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  indicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.4)',
    marginLeft: -7,
  },
  ends: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  endLabel: {
    fontSize: 10,
  },
});

export default DietBar;
