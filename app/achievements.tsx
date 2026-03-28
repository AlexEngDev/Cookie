import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useGameStore } from '../src/store/gameStore';
import { ACHIEVEMENTS } from '../src/constants/achievements';
import { Achievement } from '../src/types';
import { STAGES } from '../src/constants/stages';
import { Colors } from '../src/constants/colors';

/** Format the reward value for display */
function formatReward(achievement: Achievement): string {
  const { type, value } = achievement.reward;
  if (type === 'clickMultiplier') return `+${Math.round(value * 100)}% click power`;
  if (type === 'passiveMultiplier') return `+${Math.round(value * 100)}% passive income`;
  if (type === 'foodBonus') return `+${value} food per click`;
  return '';
}

/** Format the condition for display */
function formatCondition(achievement: Achievement): string {
  const { type, value } = achievement.condition;
  if (type === 'totalFood') return `Collect ${value.toLocaleString()} food`;
  if (type === 'clickCount') return `Click ${value.toLocaleString()} times`;
  if (type === 'stage') return `Reach Stage ${value}`;
  if (type === 'totalUpgrades') return `Buy ${value} upgrades total`;
  if (type === 'upgradeLevel') return `Upgrade level ${value}`;
  return '';
}

/** Single achievement card with fade-in animation when unlocked */
function AchievementCard({
  achievement,
  unlocked,
}: {
  achievement: Achievement;
  unlocked: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(unlocked ? 1 : 0)).current;

  useEffect(() => {
    if (unlocked) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  // fadeAnim is a stable Animated.Value ref; including it satisfies exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, fadeAnim]);

  return (
    <Animated.View
      style={[
        styles.card,
        unlocked ? styles.cardUnlocked : styles.cardLocked,
        { opacity: unlocked ? fadeAnim : 0.4 },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{achievement.emoji}</Text>
        <View style={styles.cardTitleGroup}>
          <Text style={[styles.cardName, !unlocked && styles.cardNameLocked]}>
            {achievement.name}
          </Text>
          <Text style={styles.cardDescription}>{achievement.description}</Text>
        </View>
        <Text style={styles.cardStatus}>{unlocked ? '✅' : '🔒'}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.conditionText}>{formatCondition(achievement)}</Text>
        <Text style={styles.rewardText}>{formatReward(achievement)}</Text>
      </View>
    </Animated.View>
  );
}

/** Achievements screen listing all achievements with progress */
export default function AchievementsScreen() {
  const currentStage = useGameStore((state) => state.currentStage);
  const unlockedAchievements = useGameStore((state) => state.unlockedAchievements);

  const bgColorAnim = useRef(new Animated.Value(currentStage)).current;

  // Animate background colour to match the current stage
  useEffect(() => {
    Animated.timing(bgColorAnim, {
      toValue: currentStage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [currentStage]);

  const backgroundColor = bgColorAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      STAGES[0].color,
      STAGES[1].color,
      STAGES[2].color,
      STAGES[3].color,
    ],
  });

  const total = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievements.length;
  const progressPercent = total > 0 ? unlockedCount / total : 0;

  return (
    <Animated.View style={[styles.root, { backgroundColor }]}>
      <SafeAreaView style={styles.safe}>
        {/* Header row with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🏆 Achievements</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        {/* Progress summary */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            {unlockedCount} / {total} Unlocked
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent * 100}%` }]} />
          </View>
        </View>

        {/* Achievement cards list */}
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {ACHIEVEMENTS.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              unlocked={unlockedAchievements.includes(achievement.id)}
            />
          ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    backgroundColor: Colors.ui.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.ui.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backButtonText: {
    color: Colors.ui.text,
    fontSize: 14,
    fontWeight: '600',
  },
  backButtonPlaceholder: {
    width: 70,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.ui.text,
    textAlign: 'center',
  },
  progressContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 6,
  },
  progressLabel: {
    color: Colors.ui.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.progress.track,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.progress.fill,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  cardUnlocked: {
    backgroundColor: Colors.ui.card,
    borderColor: Colors.ui.accent,
    shadowColor: Colors.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  cardLocked: {
    backgroundColor: Colors.ui.card,
    borderColor: Colors.ui.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardTitleGroup: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.ui.text,
  },
  cardNameLocked: {
    color: Colors.ui.textSecondary,
  },
  cardDescription: {
    fontSize: 12,
    color: Colors.ui.textSecondary,
  },
  cardStatus: {
    fontSize: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.cardBorder,
  },
  conditionText: {
    fontSize: 11,
    color: Colors.ui.textSecondary,
    fontStyle: 'italic',
  },
  rewardText: {
    fontSize: 11,
    color: Colors.ui.accent,
    fontWeight: '600',
  },
});
