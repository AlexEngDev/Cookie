import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';

interface EvolveButtonProps {
  /** Можно ли эволюционировать (хватает еды) */
  canEvolve: boolean;
  /** Эмодзи следующей стадии */
  nextEmoji?: string;
  /** Название следующей стадии */
  nextName?: string;
  /** Обработчик нажатия */
  onPress: () => void;
}

/**
 * Кнопка эволюции — становится активной, когда накоплено достаточно еды.
 * При нажатии воспроизводит анимацию вспышки.
 */
const EvolveButton: React.FC<EvolveButtonProps> = ({
  canEvolve,
  nextEmoji,
  nextName,
  onPress,
}) => {
  const flashAnim = useRef(new Animated.Value(1)).current;

  /** Анимация вспышки при эволюции */
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
    // Максимальная стадия — показываем финальное сообщение
    return (
      <Animated.View style={[styles.maxStageContainer, { transform: [{ scale: flashAnim }] }]}>
        <Text style={styles.maxStageText}>🏆 Максимальная стадия!</Text>
        <Text style={styles.maxStageSubText}>Ты достиг вершины эволюции</Text>
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
          {canEvolve ? `⬆️ Эволюционировать в ${nextEmoji} ${nextName}!` : `🔒 Нужно больше еды`}
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
