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
import HealthBar from '../src/components/HealthBar';
import EvolveButton from '../src/components/EvolveButton';
import ParticleSystem, { ParticleSystemRef } from '../src/components/ParticleSystem';
import WorldMap from '../src/components/WorldMap';
import DietBar from '../src/components/DietBar';

// ─── Diet food categorisation ─────────────────────────────────────────────────

/** Emojis that count as plant-based food → shift diet toward Herbivore */
const PLANT_EMOJIS = new Set([
  '🌿', '🫐', '🍎', '🍄', '🥕', '🍞', '🪸', '🐚',
]);

/** Emojis that count as meat food → shift diet toward Carnivore */
const MEAT_EMOJIS = new Set([
  '🍖', '🥩', '🍗',
]);

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
  const evolve = useGameStore((state) => state.evolve);
  const reset = useGameStore((state) => state.reset);
  const loadSavedState = useGameStore((state) => state.loadSavedState);
  const hapticsEnabled = useGameStore((state) => state.hapticsEnabled);
  const toggleHaptics = useGameStore((state) => state.toggleHaptics);
  const unlockedAchievements = useGameStore((state) => state.unlockedAchievements);
  const mutations = useGameStore((state) => state.mutations);
  const dietScore = useGameStore((state) => state.dietScore);
  const eatFoodType = useGameStore((state) => state.eatFoodType);
  const currentHealth = useGameStore((state) => state.currentHealth);
  const maxHealth = useGameStore((state) => state.maxHealth);
  const deathCount = useGameStore((state) => state.deathCount);
  const takeDamage = useGameStore((state) => state.takeDamage);
  const heal = useGameStore((state) => state.heal);
  const loseFood = useGameStore((state) => state.loseFood);

  // Animated value for interpolating the background colour between stages
  const bgColorAnim = useRef(new Animated.Value(0)).current;

  // Animated value for the death flash overlay (0 = hidden, 1 = visible)
  const deathOverlayAnim = useRef(new Animated.Value(0)).current;

  // Counts food items collected since the last heal — heal 1 HP every 10 items
  const foodEatenSinceHealRef = useRef(0);

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

  // Show a full-screen red flash whenever the player dies
  const prevDeathCount = useRef(deathCount);
  useEffect(() => {
    if (deathCount > prevDeathCount.current) {
      prevDeathCount.current = deathCount;
      // Reset the food-eaten-for-heal counter so the player can't heal right after respawning
      foodEatenSinceHealRef.current = 0;
      Animated.sequence([
        Animated.timing(deathOverlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(deathOverlayAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [deathCount, deathOverlayAnim]);

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
  const handleFoodCollected = useCallback((emoji: string) => {
    tapFeedback();
    clickFood();
    // Jaws mutation bonus: extra food per collected item
    if (mutations.jawsLevel > 0) {
      addPassiveFood(mutations.jawsLevel * 2);
    }
    // Diet tracking: plants shift toward herbivore, meat toward carnivore
    if (PLANT_EMOJIS.has(emoji)) {
      eatFoodType('plant');
    } else if (MEAT_EMOJIS.has(emoji)) {
      eatFoodType('meat');
    }
    // Healing mechanic: heal 1 HP every 10 food items collected
    foodEatenSinceHealRef.current += 1;
    if (foodEatenSinceHealRef.current >= 10) {
      foodEatenSinceHealRef.current = 0;
      heal(1);
    }
  }, [tapFeedback, clickFood, addPassiveFood, mutations.jawsLevel, eatFoodType, heal]);

  /** Player eats a prey creature — award bonus food, heal, and trigger haptic feedback */
  const handlePreyEaten = useCallback(() => {
    tapFeedback();
    // Carnivore diet bonus: +50% prey food when score > 30
    const carnivoreMultiplier = dietScore > 30 ? 1.5 : 1;
    addPassiveFood(stage.clickPower * 5 * carnivoreMultiplier);
    eatFoodType('meat');
    // Eating prey always attempts to heal 1 HP
    heal(1);
  }, [tapFeedback, addPassiveFood, stage.clickPower, dietScore, eatFoodType, heal]);

  /** Player (now bigger) eats a predator — award a large food bonus */
  const handlePredatorEaten = useCallback(() => {
    tapFeedback();
    addPassiveFood(20);
    eatFoodType('meat');
  }, [tapFeedback, addPassiveFood, eatFoodType]);

  /** A predator hits the player — deduct 1 HP and trigger haptic feedback.
   *  Spikes mutation at max level (5) fully blocks the damage. */
  const handlePredatorHit = useCallback(() => {
    tapFeedback();
    // Spikes fully block damage at level 5 (5 × 2 = 10 ≥ 10)
    const damageBlocked = mutations.spikesLevel * 2 >= 10;
    if (!damageBlocked) {
      takeDamage(1);
    }
  }, [tapFeedback, takeDamage, mutations.spikesLevel]);

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
          playerFood={food}
          onFoodCollected={handleFoodCollected}
          onPreyEaten={handlePreyEaten}
          onPredatorEaten={handlePredatorEaten}
          onPredatorHit={handlePredatorHit}
          mutations={mutations}
          dietScore={dietScore}
          onDashActivated={loseFood}
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
                onPress={() => router.push('/mutations')}
              >
                <Text style={styles.topButtonText}>🧬</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.topButton}
                onPress={() => router.push('/shop')}
              >
                <Text style={styles.topButtonText}>🛍️</Text>
              </TouchableOpacity>
              {currentStage >= 3 && (
                <TouchableOpacity
                  style={styles.topButton}
                  onPress={() => router.push('/buildings')}
                >
                  <Text style={styles.topButtonText}>🏛️</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Resource bar: food counter + passive income */}
          <ResourcePanel
            food={food}
            totalFood={totalFood}
            passiveIncome={stage.passiveIncome}
            clickCount={clickCount}
          />

          {/* Health bar: heart icons showing current / max HP */}
          <HealthBar currentHealth={currentHealth} maxHealth={maxHealth} />

          {/* Diet scale: shows Herbivore ↔ Omnivore ↔ Carnivore balance */}
          <DietBar dietScore={dietScore} />

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

        {/* Death flash overlay — full-screen red flash when the player dies */}
        <Animated.View
          style={[styles.deathOverlay, { opacity: deathOverlayAnim }]}
          pointerEvents="none"
        >
          <Text style={styles.deathText}>💀 You died! Food lost.</Text>
        </Animated.View>

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
  deathOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.ui.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deathText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
});

