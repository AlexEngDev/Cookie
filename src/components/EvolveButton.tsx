import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';

interface EvolveButtonProps {
  /** Whether the player has enough food to evolve */
  canEvolve: boolean;
  /** Emoji of the next evolution stage */
  nextEmoji?: string;
  /** Name of the next evolution stage */
  nextName?: string;
  /** Handler called when the button is pressed */
  onPress: () => void;
}

/**
 * Evolve button — becomes active when enough food has been collected.
 * Plays a brief flash animation on press.
 */
const EvolveButton: React.FC<EvolveButtonProps> = ({
  canEvolve,
  nextEmoji,
  nextName,
  onPress,
}) => {
  const flashAnim = useRef(new Animated.Value(1)).current;

  /** Flash animation played when the player evolves */
  const handlePress = () => {
    if (!canEvolve) return;

    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1.15,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  if (!nextEmoji) {
    // Maximum stage reached — show final message
    return (
      <Animated.View style={[styles.maxStageContainer, { transform: [{ scale: flashAnim }] }]}>
        <Text style={styles.maxStageText}>🏆 Maximum stage reached!</Text>
        <Text style={styles.maxStageSubText}>You have reached the pinnacle of evolution</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: flashAnim }] }}>
      <TouchableOpacity
        style={[styles.button, canEvolve ? styles.buttonActive : styles.buttonDisabled]}
        onPress={handlePress}
        disabled={!canEvolve}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {canEvolve ? `⬆️ Evolve into ${nextEmoji} ${nextName}!` : `🔒 Need more food`}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  buttonActive: {
    backgroundColor: Colors.ui.success,
    shadowColor: Colors.ui.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: Colors.ui.text,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  maxStageContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  maxStageText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.ui.accent,
  },
  maxStageSubText: {
    fontSize: 14,
    color: Colors.ui.textSecondary,
    marginTop: 4,
  },
});

export default EvolveButton;
