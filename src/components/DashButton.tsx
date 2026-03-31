import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface DashButtonProps {
  /** True while the dash is actively boosting speed */
  isDashing: boolean;
  /** Seconds remaining on the cooldown (0 = ready) */
  cooldownSecs: number;
  /** False when the player cannot afford the food cost */
  canAfford: boolean;
  /** Called when the player taps the button (only fires when enabled) */
  onPress: () => void;
}

/**
 * Floating dash action button rendered as an overlay in the game world.
 * Shows a countdown while the ability is recharging and grays out when
 * the player cannot use it (on cooldown or insufficient food).
 */
const DashButton: React.FC<DashButtonProps> = React.memo(
  ({ isDashing, cooldownSecs, canAfford, onPress }) => {
    const isDisabled = isDashing || cooldownSecs > 0 || !canAfford;

    let label: string;
    if (isDashing) {
      label = '⚡';
    } else if (cooldownSecs > 0) {
      label = `${cooldownSecs}s`;
    } else {
      label = '⚡ Dash';
    }

    return (
      <TouchableOpacity
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
        accessibilityLabel="Dash ability"
        accessibilityHint={
          isDashing
            ? 'Dash is active'
            : cooldownSecs > 0
              ? `Recharges in ${cooldownSecs} seconds`
              : !canAfford
                ? 'Not enough food to dash'
                : 'Tap to dash — burst of speed for 1.5 seconds'
        }
        accessibilityRole="button"
      >
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 200,
    left: 12,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 200, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(80, 80, 80, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  labelDisabled: {
    color: 'rgba(255, 255, 255, 0.45)',
  },
});

export default DashButton;
