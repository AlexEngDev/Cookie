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
import { BUILDINGS, getBuildingCost, Building } from '../src/constants/buildings';
import { STAGES } from '../src/constants/stages';
import { Colors } from '../src/constants/colors';

/**
 * Buildings screen — available from stage 3 ("Mind").
 * Lets the player purchase civilization buildings that generate passive food income.
 * Follows the same pattern as the Upgrade Shop screen.
 */
export default function BuildingsScreen() {
  const food = useGameStore((state) => state.food);
  const currentStage = useGameStore((state) => state.currentStage);
  const buildings = useGameStore((state) => state.buildings);
  const buyBuilding = useGameStore((state) => state.buyBuilding);

  const { purchaseFeedback } = useHaptics();

  const stageColor = STAGES[currentStage].color;

  const handleBuy = (buildingId: string) => {
    purchaseFeedback();
    buyBuilding(buildingId);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: stageColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏛️ Buildings</Text>
        <View style={styles.backButton} />
      </View>

      {/* Building list */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {BUILDINGS.map((building) => (
          <BuildingCard
            key={building.id}
            building={building}
            currentLevel={buildings[building.id] ?? 0}
            food={food}
            onBuy={() => handleBuy(building.id)}
          />
        ))}
      </ScrollView>

      {/* Footer — current food balance */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>🍖 {Math.floor(food).toLocaleString()} food</Text>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Building card component
// ---------------------------------------------------------------------------

interface BuildingCardProps {
  building: Building;
  currentLevel: number;
  food: number;
  onBuy: () => void;
}

function BuildingCard({ building, currentLevel, food, onBuy }: BuildingCardProps) {
  const isMaxLevel = currentLevel >= building.maxLevel;
  const cost = getBuildingCost(building, currentLevel);
  const canAfford = food >= cost;
  const buyDisabled = isMaxLevel || !canAfford;

  // Income this building produces at its current level
  const currentIncome = building.incomePerLevel * currentLevel;
  // Income at the next level (shown as a preview)
  const nextIncome = building.incomePerLevel * (currentLevel + 1);

  const progressRatio = currentLevel / building.maxLevel;

  return (
    <View style={styles.card}>
      {/* Top row — emoji, name, level */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{building.emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{building.name}</Text>
          <Text style={styles.cardDescription}>{building.description}</Text>
          {currentLevel > 0 && (
            <Text style={styles.cardIncome}>
              📈 {currentIncome}/sec
              {!isMaxLevel && ` → ${nextIncome}/sec`}
            </Text>
          )}
        </View>
        <Text style={styles.cardLevel}>
          {currentLevel}/{building.maxLevel}
        </Text>
      </View>

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
            {isMaxLevel ? 'MAX' : 'Build'}
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
  cardIncome: {
    fontSize: 12,
    color: Colors.ui.accent,
    marginTop: 2,
  },
  cardLevel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.ui.accent,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.progress.track,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.progress.fill,
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
