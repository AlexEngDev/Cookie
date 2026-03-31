import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useGameStore } from '../src/store/gameStore';
import useHaptics from '../src/hooks/useHaptics';
import { STAGES } from '../src/constants/stages';
import { Colors } from '../src/constants/colors';

/** Maximum level for each mutation */
const MAX_MUTATION_LEVEL = 5;

/** Food cost for mutation level 1 — doubles each subsequent level */
const BASE_MUTATION_COST = 50;

/**
 * Cost to purchase the next level of a mutation.
 * Starts at BASE_MUTATION_COST and doubles each level: 50, 100, 200, 400, 800.
 */
function getMutationCost(currentLevel: number): number {
  return Math.floor(BASE_MUTATION_COST * Math.pow(2, currentLevel));
}

/** Metadata for each mutation displayed in the shop */
const MUTATIONS = [
  {
    type: 'speed' as const,
    emoji: '〰️',
    name: 'Flagella / Fins',
    description: 'Grows powerful fins that increase movement speed by +25% per level.',
    effect: (level: number) => `Speed ×${(1 + level * 0.25).toFixed(2)}`,
  },
  {
    type: 'spikes' as const,
    emoji: '🗡️',
    name: 'Spikes',
    description: 'Hardens the outer shell with spikes, reducing food lost on predator hits by 2 per level.',
    effect: (level: number) => `Food lost: ${Math.max(0, 10 - level * 2)} (base 10)`,
  },
  {
    type: 'jaws' as const,
    emoji: '🦷',
    name: 'Jaws',
    description: 'Develops powerful jaws that increase food collection radius and +2 bonus food per item.',
    effect: (level: number) => `Radius ×${(1 + level * 0.2).toFixed(1)}, +${level * 2} bonus food`,
  },
];

/**
 * Mutation Shop screen — lets players spend food (DNA) to buy body parts
 * that affect gameplay mechanics (speed, defense, eating).
 */
export default function MutationsScreen() {
  const food = useGameStore((state) => state.food);
  const currentStage = useGameStore((state) => state.currentStage);
  const mutations = useGameStore((state) => state.mutations);
  const buyMutation = useGameStore((state) => state.buyMutation);

  const { purchaseFeedback } = useHaptics();

  const stageColor = STAGES[currentStage].color;

  const handleBuy = (type: 'speed' | 'spikes' | 'jaws') => {
    const currentLevel = mutations[`${type}Level` as keyof typeof mutations];
    const cost = getMutationCost(currentLevel);
    purchaseFeedback();
    buyMutation(type, cost);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: stageColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🧬 Mutations</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Spend food (DNA) to evolve your creature's body parts and unlock new abilities.
        </Text>

        {MUTATIONS.map((mutation) => {
          const currentLevel = mutations[`${mutation.type}Level` as keyof typeof mutations];
          return (
            <MutationCard
              key={mutation.type}
              mutation={mutation}
              currentLevel={currentLevel}
              food={food}
              onBuy={() => handleBuy(mutation.type)}
            />
          );
        })}
      </ScrollView>

      {/* Footer — current food balance */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>🍖 {Math.floor(food).toLocaleString()} food</Text>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Mutation card component
// ---------------------------------------------------------------------------

interface MutationCardProps {
  mutation: typeof MUTATIONS[number];
  currentLevel: number;
  food: number;
  onBuy: () => void;
}

function MutationCard({ mutation, currentLevel, food, onBuy }: MutationCardProps) {
  const isMaxLevel = currentLevel >= MAX_MUTATION_LEVEL;
  const cost = getMutationCost(currentLevel);
  const canAfford = food >= cost;
  const buyDisabled = isMaxLevel || !canAfford;

  const progressRatio = currentLevel / MAX_MUTATION_LEVEL;

  return (
    <View style={styles.card}>
      {/* Top row — emoji, name, level */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{mutation.emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{mutation.name}</Text>
          <Text style={styles.cardDescription}>{mutation.description}</Text>
        </View>
        <Text style={styles.cardLevel}>
          {currentLevel}/{MAX_MUTATION_LEVEL}
        </Text>
      </View>

      {/* Current effect */}
      {currentLevel > 0 && (
        <View style={styles.effectRow}>
          <Text style={styles.effectLabel}>Current: </Text>
          <Text style={styles.effectValue}>{mutation.effect(currentLevel)}</Text>
        </View>
      )}

      {/* Level progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
      </View>

      {/* Bottom row — cost and buy button */}
      <View style={styles.cardFooter}>
        {isMaxLevel ? (
          <Text style={styles.maxLabel}>MAX</Text>
        ) : (
          <Text style={[styles.costText, !canAfford && styles.costTextDisabled]}>
            🍖 {cost.toLocaleString()}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.buyButton, buyDisabled && styles.buyButtonDisabled]}
          onPress={onBuy}
          disabled={buyDisabled}
        >
          <Text style={[styles.buyButtonText, buyDisabled && styles.buyButtonTextDisabled]}>
            {isMaxLevel ? 'MAX' : 'Evolve'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.cardBorder,
  },
  backButton: {
    minWidth: 60,
  },
  backText: {
    fontSize: 16,
    color: Colors.ui.text,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.ui.text,
    textAlign: 'center',
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.ui.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 19,
  },
  list: {
    padding: 16,
    gap: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.ui.cardBorder,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  footerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.ui.text,
  },
  // Card
  card: {
    backgroundColor: Colors.ui.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.ui.cardBorder,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.ui.text,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.ui.textSecondary,
    marginTop: 2,
  },
  cardLevel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.ui.accent,
  },
  effectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  effectLabel: {
    fontSize: 13,
    color: Colors.ui.textSecondary,
  },
  effectValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ui.success,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.progress.track,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.ui.accent,
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  costText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ui.text,
  },
  costTextDisabled: {
    color: Colors.ui.textSecondary,
  },
  maxLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.ui.accent,
  },
  buyButton: {
    backgroundColor: Colors.ui.accent,
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 10,
  },
  buyButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  buyButtonTextDisabled: {
    color: Colors.ui.textSecondary,
  },
});
