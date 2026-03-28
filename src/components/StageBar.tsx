import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface StageBarProps {
  /** Current food amount */
  current: number;
  /** Food required to evolve */
  required: number;
  /** Name of the next evolution stage */
  nextStageName?: string;
}

/**
 * Evolution progress bar — shows how much food has been collected
 * and how much is needed to advance to the next stage.
 */
const StageBar: React.FC<StageBarProps> = ({ current, required, nextStageName }) => {
  // Calculate fill percentage, capped at 100 %
  const progress = required === Infinity ? 1 : Math.min(current / required, 1);
  const percent = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {required === Infinity ? 'Maximum stage reached!' : `To evolve: ${nextStageName}`}
        </Text>
        <Text style={styles.percent}>{required === Infinity ? '✨' : `${percent}%`}</Text>
      </View>

      {/* Progress track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>

      {/* Food counter */}
      {required !== Infinity && (
        <Text style={styles.counter}>
          {Math.floor(current)} / {required} 🍖
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: Colors.ui.textSecondary,
    fontSize: 13,
  },
  percent: {
    color: Colors.ui.accent,
    fontSize: 13,
    fontWeight: 'bold',
  },
  track: {
    height: 12,
    backgroundColor: Colors.progress.track,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.progress.fill,
    borderRadius: 6,
  },
  counter: {
    color: Colors.ui.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
});

export default StageBar;
