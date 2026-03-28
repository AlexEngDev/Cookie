import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useGameStore } from '../src/store/gameStore';
import { useGameLoop } from '../src/hooks/useGameLoop';
import { STAGES, MAX_STAGE } from '../src/constants/stages';
import { Colors } from '../src/constants/colors';
import Creature from '../src/components/Creature';
import StageBar from '../src/components/StageBar';
import ResourcePanel from '../src/components/ResourcePanel';
import EvolveButton from '../src/components/EvolveButton';

/**
 * Главный экран игры Cookie Evolution.
 * Содержит существо для кликов, счётчик еды, прогресс-бар и кнопку эволюции.
 */
export default function GameScreen() {
  // Подключаем игровой цикл (пассивный доход)
  useGameLoop();

  // Получаем состояние и действия из стора
  const food = useGameStore((state) => state.food);
  const totalFood = useGameStore((state) => state.totalFood);
  const currentStage = useGameStore((state) => state.currentStage);
  const clickCount = useGameStore((state) => state.clickCount);
  const clickFood = useGameStore((state) => state.clickFood);
  const evolve = useGameStore((state) => state.evolve);
  const reset = useGameStore((state) => state.reset);
  const loadSavedState = useGameStore((state) => state.loadSavedState);

  // Анимация фона при смене стадии
  const bgColorAnim = useRef(new Animated.Value(0)).current;

  const stage = STAGES[currentStage];
  const nextStage = currentStage < MAX_STAGE ? STAGES[currentStage + 1] : undefined;
  const canEvolve = nextStage !== undefined && food >= stage.foodRequired;

  // Загружаем сохранённое состояние при первом рендере
  useEffect(() => {
    loadSavedState();
  // loadSavedState — стабильная функция из Zustand
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Анимируем фон при смене стадии
  useEffect(() => {
    Animated.timing(bgColorAnim, {
      toValue: currentStage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [currentStage]);

  // Интерполяция цвета фона между стадиями
  const backgroundColor = bgColorAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      STAGES[0].color,
      STAGES[1].color,
      STAGES[2].color,
      STAGES[3].color,
    ],
  });

  /** Подтверждение сброса игры */
  const handleReset = () => {
    Alert.alert(
      'Сбросить игру?',
      'Весь прогресс будет потерян. Ты уверен?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Сбросить', style: 'destructive', onPress: reset },
      ]
    );
  };

  return (
    <Animated.View style={[styles.root, { backgroundColor }]}>
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Заголовок с названием стадии */}
          <View style={styles.header}>
            <Text style={styles.stageName}>
              {stage.emoji} {stage.name}
            </Text>
            <Text style={styles.stageDescription}>{stage.description}</Text>
          </View>

          {/* Панель ресурсов */}
          <ResourcePanel
            food={food}
            totalFood={totalFood}
            passiveIncome={stage.passiveIncome}
            clickCount={clickCount}
          />

          {/* Существо — центральный элемент для кликов */}
          <View style={styles.creatureContainer}>
            <Creature emoji={stage.emoji} onPress={clickFood} />
            <Text style={styles.tapHint}>Тапай по существу!</Text>
          </View>

          {/* Полоса прогресса до эволюции */}
          <StageBar
            current={food}
            required={stage.foodRequired}
            nextStageName={nextStage?.name}
          />

          {/* Кнопка эволюции */}
          <View style={styles.evolveContainer}>
            <EvolveButton
              canEvolve={canEvolve}
              nextEmoji={nextStage?.emoji}
              nextName={nextStage?.name}
              onPress={evolve}
            />
          </View>

          {/* Способности */}
          {currentStage > 0 && (
            <View style={styles.abilitiesContainer}>
              <Text style={styles.abilitiesTitle}>✨ Способности</Text>
              {currentStage >= 1 && (
                <Text style={styles.abilityItem}>🌱 Пассивное питание</Text>
              )}
              {currentStage >= 2 && (
                <Text style={styles.abilityItem}>⚡ Быстрая охота</Text>
              )}
              {currentStage >= 3 && (
                <Text style={styles.abilityItem}>🏛️ Строительство цивилизации</Text>
              )}
            </View>
          )}

          {/* Кнопка сброса */}
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetText}>🔄 Начать заново</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    paddingVertical: 20,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stageName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.ui.text,
    textAlign: 'center',
  },
  stageDescription: {
    fontSize: 14,
    color: Colors.ui.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  creatureContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  tapHint: {
    fontSize: 13,
    color: Colors.ui.textSecondary,
    fontStyle: 'italic',
  },
  evolveContainer: {
    paddingHorizontal: 0,
  },
  abilitiesContainer: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: Colors.ui.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.ui.cardBorder,
    gap: 8,
  },
  abilitiesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.ui.text,
    marginBottom: 4,
  },
  abilityItem: {
    fontSize: 14,
    color: Colors.ui.textSecondary,
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  resetText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
});
