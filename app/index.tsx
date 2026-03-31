import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useGameStore } from '../src/store/gameStore';
import { useGameLoop } from '../src/hooks/useGameLoop';
import useHaptics from '../src/hooks/useHaptics';
import { STAGES, MAX_STAGE } from '../src/constants/stages';
import { Colors } from '../src/constants/colors';
import StageBar from '../src/components/StageBar';
import ResourcePanel from '../src/components/ResourcePanel';
import EvolveButton from '../src/components/EvolveButton';
import ParticleSystem, { ParticleSystemRef } from '../src/components/ParticleSystem';
import WorldMap from '../src/components/WorldMap';

/**
 * Main game screen for Cookie Evolution.
 * Displays a 2D pan-able world with the creature, food items, and decorations.
 * A fixed HUD overlay shows the resource panel, progress bar, and evolve button.
 */
export default function GameScreen() {
  // Start the passive income game loop
  useGameLoop();

  // Haptic feedback functions
  const { tapFeedback, evolveFeedback, achievementFeedback } = useHaptics();

  // Read state and actions from the game store
  const food = useGameStore((state) => state.food);
  const totalFood = useGameStore((state) => state.totalFood);
  const currentStage = useGameStore((state) => state.currentStage);
  const clickCount = useGameStore((state) => state.clickCount);
  const clickFood = useGameStore((state) => state.clickFood);
  const addPassiveFood = useGameStore((state) => state.addPassiveFood);
  const loseFood = useGameStore((state) => state.loseFood);
  const evolve = useGameStore((state) => state.evolve);
  const reset = useGameStore((state) => state.reset);
  const loadSavedState = useGameStore((state) => state.loadSavedState);
  const hapticsEnabled = useGameStore((state) => state.hapticsEnabled);
  const toggleHaptics = useGameStore((state) => state.toggleHaptics);
  const unlockedAchievements = useGameStore((state) => state.unlockedAchievements);

  // Animated value for interpolating the background colour between stages
  const bgColorAnim = useRef(new Animated.Value(0)).current;

  // Ref to the particle system — used to trigger the tap effect
  const particleRef = useRef<ParticleSystemRef>(null);

  // Track previous achievement count to detect newly unlocked achievements
  const prevAchievementCount = useRef(unlockedAchievements.length);

  const stage = STAGES[currentStage];
  const nextStage = currentStage < MAX_STAGE ? STAGES[currentStage + 1] : undefined;
  const canEvolve = nextStage !== undefined && food >= stage.foodRequired;

  // Load saved progress on first render
  useEffect(() => {
    loadSavedState();
  // loadSavedState is a stable Zustand action reference
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate the background colour whenever the stage changes
  useEffect(() => {
    Animated.timing(bgColorAnim, {
      toValue: currentStage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [currentStage]);

  // Fire achievement haptic when a new achievement is unlocked
  useEffect(() => {
    if (unlockedAchievements.length > prevAchievementCount.current) {
      achievementFeedback();
    }
    prevAchievementCount.current = unlockedAchievements.length;
  }, [unlockedAchievements.length, achievementFeedback]);

  // Interpolate background colour across all four stage colours
  const backgroundColor = bgColorAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      STAGES[0].color,
      STAGES[1].color,
      STAGES[2].color,
      STAGES[3].color,
    ],
  });

  /** Collect a food item from the world — award food and trigger haptic feedback */
  const handleFoodCollected = useCallback(() => {
    tapFeedback();
    clickFood();
  }, [tapFeedback, clickFood]);

  /** Player eats a prey creature — award bonus food and trigger haptic feedback */
  const handlePreyEaten = useCallback(() => {
    tapFeedback();
    // Prey gives 5× the stage's base click power (always more than a food item)
    addPassiveFood(stage.clickPower * 5);
  }, [tapFeedback, addPassiveFood, stage.clickPower]);

  /** A predator hits the player — deduct food and trigger haptic feedback */
  const handlePredatorHit = useCallback(() => {
    tapFeedback();
    loseFood(10);
  }, [tapFeedback, loseFood]);

  /** Evolve to the next stage and trigger haptic feedback */
  const handleEvolve = () => {
    evolveFeedback();
    evolve();
  };

  /** Show a confirmation dialog before resetting all progress */
  const handleReset = () => {
    Alert.alert(
      'Reset Game?',
      'All progress will be lost. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: reset },
      ]
    );
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <Animated.View style={[styles.root, { backgroundColor }]}>

        {/* 2D World — creature moves toward touch, fills the full screen */}
        <WorldMap
          stageIndex={currentStage}
          onFoodCollected={handleFoodCollected}
          onPreyEaten={handlePreyEaten}
          onPredatorHit={handlePredatorHit}
        />

        {/* Fixed HUD — always on top, touches pass through to world behind */}
        <SafeAreaView style={styles.hud} pointerEvents="box-none">

          {/* Top bar: mute | stage name | achievements | shop */}
          <View style={styles.topBar} pointerEvents="box-none">
            <TouchableOpacity style={styles.topButton} onPress={toggleHaptics}>
              <Text style={styles.topButtonText}>{hapticsEnabled ? '🔊' : '🔇'}</Text>
            </TouchableOpacity>

            <Text style={styles.stageName}>
              {stage.emoji} {stage.name}
            </Text>

            <View style={styles.topButtons}>
              <TouchableOpacity
                style={styles.topButton}
                onPress={() => router.push('/achievements')}
              >
                <Text style={styles.topButtonText}>🏆</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.topButton}
                onPress={() => router.push('/shop')}
              >
                <Text style={styles.topButtonText}>🛍️</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Resource bar: food counter + passive income */}
          <ResourcePanel
            food={food}
            totalFood={totalFood}
            passiveIncome={stage.passiveIncome}
            clickCount={clickCount}
          />

          {/* Spacer — keeps the bottom HUD pinned to the bottom */}
          <View style={styles.flex1} pointerEvents="none" />

          {/* Bottom HUD: evolution progress bar + evolve button + reset */}
          <View style={styles.bottomHud} pointerEvents="box-none">
            <StageBar
              current={food}
              required={stage.foodRequired}
              nextStageName={nextStage?.name}
            />
            <EvolveButton
              canEvolve={canEvolve}
              nextEmoji={nextStage?.emoji}
              nextName={nextStage?.name}
              onPress={handleEvolve}
            />
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetText}>🔄 Start over</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>

        {/* Particle effect layer — covers the full screen but never blocks touches */}
        <ParticleSystem
          ref={particleRef}
          stageIndex={currentStage}
          clickPower={stage.clickPower}
        />

      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** Fixed HUD overlay covering the whole screen, non-blocking by default */
  hud: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  topButton: {
    backgroundColor: Colors.ui.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.ui.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  topButtonText: {
    fontSize: 22,
  },
  stageName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.ui.text,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  flex1: {
    flex: 1,
  },
  bottomHud: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resetText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
});

