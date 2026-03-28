import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet, Text } from 'react-native';

interface CreatureProps {
  /** Эмодзи текущей стадии существа */
  emoji: string;
  /** Обработчик клика по существу */
  onPress: () => void;
}

/**
 * Компонент существа — большая кнопка с эмодзи и анимацией пульсации.
 * При нажатии воспроизводит анимацию масштабирования.
 */
const Creature: React.FC<CreatureProps> = ({ emoji, onPress }) => {
  // Анимация масштаба при клике
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Пульсирующая анимация (idle)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Запускаем пульсацию при монтировании
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  /** Анимация при нажатии — уменьшение и возврат */
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.container}>
      <Animated.View
        style={[
          styles.creature,
          {
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
            ],
          },
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  creature: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emoji: {
    fontSize: 90,
    textAlign: 'center',
  },
});

export default Creature;
