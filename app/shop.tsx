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
import { UPGRADES, getUpgradeCost } from '../src/constants/upgrades';
import { STAGES } from '../src/constants/stages';
import { Colors } from '../src/constants/colors';
import { Upgrade } from '../src/types';

/**
 * Upgrade Shop screen.
 * Displays all available upgrades with their current level, cost, and a buy button.
 * The background colour reflects the player's current evolution stage.
 */
export default function ShopScreen() {
  const food = useGameStore((state) => state.food);
  const currentStage = useGameStore((state) => state.currentStage);
  const upgrades = useGameStore((state) => state.upgrades);
  const buyUpgrade = useGameStore((state) => state.buyUpgrade);

  // Haptic feedback for upgrade purchases
  const { purchaseFeedback } = useHaptics();

  // Use the current stage colour as the background tint
  const stageColor = STAGES[currentStage].color;

  /** Buy an upgrade and trigger purchase haptic feedback */
  const handleBuy = (upgradeId: string) => {
    purchaseFeedback();
    buyUpgrade(upgradeId);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: stageColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🛍️ Upgrade Shop</Text>
        <View style={styles.backButton} />
      </View>

      {/* Upgrade list */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {UPGRADES.map((upgrade) => (
          <UpgradeCard
            key={upgrade.id}
            upgrade={upgrade}
            currentLevel={upgrades[upgrade.id] ?? 0}
            food={food}
            onBuy={() => handleBuy(upgrade.id)}
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
// Upgrade card component
// ---------------------------------------------------------------------------

interface UpgradeCardProps {
  upgrade: Upgrade;
  currentLevel: number;
  food: number;
  onBuy: () => void;
}

function UpgradeCard({ upgrade, currentLevel, food, onBuy }: UpgradeCardProps) {
  const isMaxLevel = currentLevel >= upgrade.maxLevel;
  const cost = getUpgradeCost(upgrade, currentLevel);
  const canAfford = food >= cost;
  const buyDisabled = isMaxLevel || !canAfford;

  // Level progress bar fill ratio (0–1)
  const progressRatio = currentLevel / upgrade.maxLevel;

  return (
    <View style={styles.card}>
      {/* Top row — emoji, name, level */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{upgrade.emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{upgrade.name}</Text>
          <Text style={styles.cardDescription}>{upgrade.description}</Text>
        </View>
        <Text style={styles.cardLevel}>
          {currentLevel}/{upgrade.maxLevel}
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
            {isMaxLevel ? 'MAX' : 'Buy'}
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
    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Elevation (Android)
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
