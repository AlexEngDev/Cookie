import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { STAGES } from '../../src/constants/stages';
import Creature from './Creature';

// ─── World constants ──────────────────────────────────────────────────────────

const WORLD_SIZE = 1200;
const CREATURE_SIZE = 200;
/** Starting world position (centre of the map) */
const CREATURE_START_X = WORLD_SIZE / 2;
const CREATURE_START_Y = WORLD_SIZE / 2;
const FOOD_COUNT = 8;
const FOOD_ITEM_SIZE = 40;
const FOOD_RESPAWN_MS = 3000;
const FOOD_EMOJIS: string[] = ['🍖', '🌿', '🫐'];
/** World units per animation frame the creature moves (~3 px/frame at 60 fps) */
const CREATURE_SPEED = 3;
/** World-unit radius within which the creature eats a food item */
const COLLISION_RADIUS = 55;
/** Creature stops moving once it is within this many world units of the target */
const MOVEMENT_STOP_DIST = 2;

// ─── Decoration seeds (static, deterministic) ─────────────────────────────────

/** Simple seeded pseudo-random number generator (LCG) */
function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

interface Decoration {
  id: string;
  worldX: number;
  worldY: number;
  emoji: string;
}

/** Generate decorations once, keeping them well away from the creature start. */
function buildDecorations(): Decoration[] {
  const rand = seededRand(42);
  const decorations: Decoration[] = [];
  const margin = 60; // keep away from world edges

  const placeItems = (
    count: number,
    emoji: string,
    prefix: string,
    avoidCenterRadius: number,
  ) => {
    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      // Retry until the position is outside the creature's safe zone
      do {
        x = margin + rand() * (WORLD_SIZE - margin * 2);
        y = margin + rand() * (WORLD_SIZE - margin * 2);
      } while (
        Math.abs(x - CREATURE_START_X) < avoidCenterRadius &&
        Math.abs(y - CREATURE_START_Y) < avoidCenterRadius
      );
      decorations.push({ id: `${prefix}_${i}`, worldX: x, worldY: y, emoji });
    }
  };

  placeItems(6, '🌲', 'tree', 200);
  placeItems(4, '🪨', 'rock', 150);
  return decorations;
}

const DECORATIONS = buildDecorations();

// ─── Food item type ───────────────────────────────────────────────────────────

interface FoodItem {
  id: string;
  worldX: number;
  worldY: number;
  collected: boolean;
  emoji: string;
}

/** Generate an initial set of food items with random positions. */
function buildInitialFood(): FoodItem[] {
  const rand = seededRand(99);
  return Array.from({ length: FOOD_COUNT }, (_, i) => ({
    id: `food_${i}`,
    worldX: 80 + rand() * (WORLD_SIZE - 160),
    worldY: 80 + rand() * (WORLD_SIZE - 160),
    collected: false,
    emoji: FOOD_EMOJIS[i % FOOD_EMOJIS.length],
  }));
}

// ─── Dot-pattern background rows ─────────────────────────────────────────────

const DOT_SPACING = 60;
const DOT_COUNT = Math.floor(WORLD_SIZE / DOT_SPACING);

// ─── Props ───────────────────────────────────────────────────────────────────

interface WorldMapProps {
  /** Current evolution stage index (0–3) */
  stageIndex: number;
  /** Called when a food item is collected (eaten by collision) */
  onFoodCollected: () => void;
}

// ─── FoodSprite ──────────────────────────────────────────────────────────────

interface FoodSpriteProps {
  item: FoodItem;
  cameraX: Animated.Value;
  cameraY: Animated.Value;
}

/**
 * A single animated food sprite that lives at its world position.
 * It pops in with a bounce scale animation and disappears when collected.
 * Collection now happens via creature collision, not tap.
 */
const FoodSprite: React.FC<FoodSpriteProps> = React.memo(
  ({ item, cameraX, cameraY }) => {
    const spawnScale = useRef(new Animated.Value(0)).current;
    // Track the previous collected state to detect respawn events
    const prevCollected = useRef(true);

    // Bounce-in animation only when the item transitions from collected → not collected (respawn)
    useEffect(() => {
      if (!item.collected && prevCollected.current) {
        spawnScale.setValue(0);
        Animated.spring(spawnScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }).start();
      }
      prevCollected.current = item.collected;
    }, [item.collected, spawnScale]);

    if (item.collected) return null;

    // Screen position derived from camera offset
    const screenX = Animated.subtract(item.worldX, cameraX);
    const screenY = Animated.subtract(item.worldY, cameraY);

    return (
      <Animated.View
        style={[
          styles.foodItem,
          {
            left: screenX,
            top: screenY,
            transform: [{ scale: spawnScale }],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.foodEmoji}>{item.emoji}</Text>
      </Animated.View>
    );
  },
);

// ─── WorldMap ─────────────────────────────────────────────────────────────────

/**
 * 2D game world canvas with Spore-like cell-stage movement.
 *
 * The world is 1200×1200 logical units. Touching anywhere on the screen sets a
 * movement target; the creature smoothly moves toward that point via a
 * requestAnimationFrame loop. The camera always follows the creature.
 * Food items are eaten automatically when the creature gets close enough.
 */
const WorldMap: React.FC<WorldMapProps> = ({
  stageIndex,
  onFoodCollected,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // ── Creature world position (Animated for rendering, refs for RAF loop) ────

  const creatureXAnim = useRef(new Animated.Value(CREATURE_START_X)).current;
  const creatureYAnim = useRef(new Animated.Value(CREATURE_START_Y)).current;
  /** Rotation angle in degrees (0 = facing right, matches SVG default) */
  const creatureRotAnim = useRef(new Animated.Value(0)).current;

  const creatureXRef = useRef(CREATURE_START_X);
  const creatureYRef = useRef(CREATURE_START_Y);
  /** World-coordinate movement target (updated on every touch event) */
  const targetXRef = useRef(CREATURE_START_X);
  const targetYRef = useRef(CREATURE_START_Y);

  // ── Camera (clamped to world bounds, always centred on creature) ───────────

  const initCamX = Math.max(0, Math.min(WORLD_SIZE - screenWidth, CREATURE_START_X - screenWidth / 2));
  const initCamY = Math.max(0, Math.min(WORLD_SIZE - screenHeight, CREATURE_START_Y - screenHeight / 2));

  const cameraXAnim = useRef(new Animated.Value(initCamX)).current;
  const cameraYAnim = useRef(new Animated.Value(initCamY)).current;
  const cameraXRef = useRef(initCamX);
  const cameraYRef = useRef(initCamY);

  // ── Food state ──────────────────────────────────────────────────────────────

  const [foodItems, setFoodItems] = useState<FoodItem[]>(buildInitialFood);

  /** Ref mirror of foodItems for collision detection inside the RAF loop */
  const foodItemsRef = useRef(foodItems);
  useEffect(() => {
    foodItemsRef.current = foodItems;
  }, [foodItems]);

  /**
   * IDs of food items currently being collected (prevents duplicate triggers
   * between the state update settling and the next animation frame).
   */
  const collectingIdsRef = useRef(new Set<string>());

  /** Collect a food item, notify the store, then respawn after 3 s. */
  const handleCollectFood = useCallback(
    (id: string) => {
      if (collectingIdsRef.current.has(id)) return;
      collectingIdsRef.current.add(id);

      setFoodItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, collected: true } : item)),
      );
      onFoodCollected();

      setTimeout(() => {
        setFoodItems((prev) => {
          // Build a list of positions already occupied by active food items
          const occupied = prev
            .filter((item) => item.id !== id && !item.collected)
            .map((item) => ({ x: item.worldX, y: item.worldY }));

          // Find a position that's not too close to other food items
          const MIN_DIST = 120;
          const margin = 80;
          let newX: number;
          let newY: number;
          let attempts = 0;
          do {
            newX = margin + Math.random() * (WORLD_SIZE - margin * 2);
            newY = margin + Math.random() * (WORLD_SIZE - margin * 2);
            attempts++;
          } while (
            attempts < 20 &&
            occupied.some(
              (pos) =>
                Math.abs(pos.x - newX) < MIN_DIST && Math.abs(pos.y - newY) < MIN_DIST,
            )
          );

          const newEmoji = FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
          collectingIdsRef.current.delete(id);
          return prev.map((item) =>
            item.id === id
              ? { ...item, worldX: newX, worldY: newY, collected: false, emoji: newEmoji }
              : item,
          );
        });
      }, FOOD_RESPAWN_MS);
    },
    [onFoodCollected],
  );

  /** Stable ref so the RAF loop always calls the latest handleCollectFood */
  const handleCollectFoodRef = useRef(handleCollectFood);
  useEffect(() => {
    handleCollectFoodRef.current = handleCollectFood;
  }, [handleCollectFood]);

  // ── requestAnimationFrame movement loop ─────────────────────────────────────

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // All mutable world-state is accessed via refs inside this loop, so the
    // only true "external" dependencies are the screen dimensions used for
    // camera clamping. Re-creating the loop on every render would reset the
    // animation frame ID unnecessarily, so deps are intentionally limited.
    const loop = () => {
      const cx = creatureXRef.current;
      const cy = creatureYRef.current;
      const dx = targetXRef.current - cx;
      const dy = targetYRef.current - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > MOVEMENT_STOP_DIST) {
        // Advance toward the target (cap at remaining distance to avoid overshoot)
        const step = Math.min(CREATURE_SPEED, dist);
        const nx = dx / dist;
        const ny = dy / dist;

        const newX = Math.max(
          CREATURE_SIZE / 2,
          Math.min(WORLD_SIZE - CREATURE_SIZE / 2, cx + nx * step),
        );
        const newY = Math.max(
          CREATURE_SIZE / 2,
          Math.min(WORLD_SIZE - CREATURE_SIZE / 2, cy + ny * step),
        );

        creatureXRef.current = newX;
        creatureYRef.current = newY;

        // Sync Animated values (JS thread – setValue is synchronous)
        creatureXAnim.setValue(newX);
        creatureYAnim.setValue(newY);
        creatureRotAnim.setValue(Math.atan2(dy, dx) * (180 / Math.PI));

        // Update camera (centred on creature, clamped to world bounds)
        const newCamX = Math.max(0, Math.min(WORLD_SIZE - screenWidth, newX - screenWidth / 2));
        const newCamY = Math.max(0, Math.min(WORLD_SIZE - screenHeight, newY - screenHeight / 2));
        cameraXAnim.setValue(newCamX);
        cameraYAnim.setValue(newCamY);
        cameraXRef.current = newCamX;
        cameraYRef.current = newCamY;

        // ── Collision detection ────────────────────────────────────────────
        for (const food of foodItemsRef.current) {
          if (food.collected || collectingIdsRef.current.has(food.id)) continue;
          const fdx = food.worldX - newX;
          const fdy = food.worldY - newY;
          if (fdx * fdx + fdy * fdy < COLLISION_RADIUS * COLLISION_RADIUS) {
            handleCollectFoodRef.current(food.id);
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenWidth, screenHeight]);

  // ── Touch → world target conversion ─────────────────────────────────────────

  /** Convert a screen-space touch point to a world target for the creature.
   *  cameraXRef/cameraYRef are read via refs deliberately to avoid stale
   *  closure issues — they are always up-to-date since the RAF loop writes
   *  them synchronously every frame. */
  const setMovementTarget = useCallback((screenX: number, screenY: number) => {
    targetXRef.current = Math.max(0, Math.min(WORLD_SIZE, screenX + cameraXRef.current));
    targetYRef.current = Math.max(0, Math.min(WORLD_SIZE, screenY + cameraYRef.current));
  }, []);

  // ── Background colour ───────────────────────────────────────────────────────

  const stageBgColor = STAGES[stageIndex]?.color ?? STAGES[0].color;

  // ── Creature screen position ────────────────────────────────────────────────

  const creatureLeft = Animated.subtract(
    Animated.subtract(creatureXAnim, CREATURE_SIZE / 2),
    cameraXAnim,
  );
  const creatureTop = Animated.subtract(
    Animated.subtract(creatureYAnim, CREATURE_SIZE / 2),
    cameraYAnim,
  );

  // Rotation string interpolated from the Animated angle value
  const creatureRotate = creatureRotAnim.interpolate({
    inputRange: [-180, 180],
    outputRange: ['-180deg', '180deg'],
    extrapolate: 'clamp',
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View
      style={StyleSheet.absoluteFill}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => setMovementTarget(e.nativeEvent.locationX, e.nativeEvent.locationY)}
      onResponderMove={(e) => setMovementTarget(e.nativeEvent.locationX, e.nativeEvent.locationY)}
    >
      <Animated.View style={StyleSheet.absoluteFill}>
        {/* ── Background world layer ──────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.worldBackground,
            {
              backgroundColor: lighten(stageBgColor, 0.12),
              left: Animated.multiply(cameraXAnim, -1),
              top: Animated.multiply(cameraYAnim, -1),
            },
          ]}
        >
          {/* Dot grid pattern for depth */}
          {Array.from({ length: DOT_COUNT }, (_, row) =>
            Array.from({ length: DOT_COUNT }, (__, col) => (
              <View
                key={`dot_${row}_${col}`}
                style={[
                  styles.dot,
                  {
                    left: col * DOT_SPACING + DOT_SPACING / 2,
                    top: row * DOT_SPACING + DOT_SPACING / 2,
                  },
                ]}
              />
            )),
          )}
        </Animated.View>

        {/* ── Decorations (trees + rocks) ─────────────────────────────────── */}
        {DECORATIONS.map((dec) => {
          const screenLeft = Animated.subtract(dec.worldX - FOOD_ITEM_SIZE / 2, cameraXAnim);
          const screenTop = Animated.subtract(dec.worldY - FOOD_ITEM_SIZE / 2, cameraYAnim);
          return (
            <Animated.View
              key={dec.id}
              style={[styles.decoration, { left: screenLeft, top: screenTop }]}
            >
              <Text style={styles.decorationEmoji}>{dec.emoji}</Text>
            </Animated.View>
          );
        })}

        {/* ── Food items (eaten by proximity, not tap) ─────────────────────── */}
        {foodItems.map((item) => (
          <FoodSprite
            key={item.id}
            item={item}
            cameraX={cameraXAnim}
            cameraY={cameraYAnim}
          />
        ))}

        {/* ── Player creature ──────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.creatureContainer,
            {
              left: creatureLeft,
              top: creatureTop,
              transform: [{ rotate: creatureRotate }],
            },
          ]}
        >
          <Creature
            stageIndex={stageIndex}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Very simple hex colour lightening — blends the colour toward white by `amount` (0–1).
 * Keeps it compatible with React Native's color system.
 */
function lighten(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `rgb(${lr},${lg},${lb})`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  worldBackground: {
    position: 'absolute',
    width: WORLD_SIZE,
    height: WORLD_SIZE,
    zIndex: 1,
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  decoration: {
    position: 'absolute',
    width: FOOD_ITEM_SIZE,
    height: FOOD_ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  decorationEmoji: {
    fontSize: 28,
  },
  foodItem: {
    position: 'absolute',
    width: FOOD_ITEM_SIZE,
    height: FOOD_ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  foodEmoji: {
    fontSize: 26,
  },
  creatureContainer: {
    position: 'absolute',
    width: CREATURE_SIZE,
    height: CREATURE_SIZE,
    zIndex: 20,
  },
});

export default WorldMap;
