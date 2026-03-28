import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  GestureEvent,
  PanGestureHandler,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { STAGES } from '../../src/constants/stages';
import Creature from './Creature';

// ─── World constants ──────────────────────────────────────────────────────────

const WORLD_SIZE = 1200;
const CREATURE_SIZE = 200;
const CREATURE_WORLD_X = 600;
const CREATURE_WORLD_Y = 600;
const FOOD_COUNT = 8;
const FOOD_ITEM_SIZE = 40;
const FOOD_RESPAWN_MS = 3000;
const FOOD_EMOJIS: string[] = ['🍖', '🌿', '🫐'];

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

/** Generate decorations once, keeping them well away from the creature. */
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
        Math.abs(x - CREATURE_WORLD_X) < avoidCenterRadius &&
        Math.abs(y - CREATURE_WORLD_Y) < avoidCenterRadius
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
  /** Called when the creature is tapped */
  onCreatureTap: () => void;
  /** Called with screen-absolute coordinates on creature press start */
  onCreatureTapCoordinates: (x: number, y: number) => void;
  /** Called when a food item is collected */
  onFoodCollected: () => void;
}

// ─── FoodSprite ──────────────────────────────────────────────────────────────

interface FoodSpriteProps {
  item: FoodItem;
  onCollect: (id: string) => void;
  cameraX: Animated.Value;
  cameraY: Animated.Value;
}

/**
 * A single animated food sprite that lives at its world position.
 * It pops in with a bounce scale animation, and disappears when collected.
 */
const FoodSprite: React.FC<FoodSpriteProps> = React.memo(
  ({ item, onCollect, cameraX, cameraY }) => {
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
      >
        <TouchableOpacity
          onPress={() => onCollect(item.id)}
          activeOpacity={0.7}
          style={styles.foodTouchable}
        >
          <Text style={styles.foodEmoji}>{item.emoji}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

// ─── WorldMap ─────────────────────────────────────────────────────────────────

/**
 * 2D pan-able game world canvas.
 *
 * The world is 1200×1200 logical units. A PanGestureHandler lets the player
 * drag to move the camera, which is stored as an Animated.ValueXY. All world
 * objects (food, decorations, creature) are positioned absolutely relative to
 * the screen by subtracting the camera offset from their world coordinates.
 */
const WorldMap: React.FC<WorldMapProps> = ({
  stageIndex,
  onCreatureTap,
  onCreatureTapCoordinates,
  onFoodCollected,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // ── Camera state ────────────────────────────────────────────────────────────

  // Initial camera: center the creature on screen
  const initialCameraX = CREATURE_WORLD_X - screenWidth / 2 + CREATURE_SIZE / 2;
  const initialCameraY = CREATURE_WORLD_Y - screenHeight / 2 + CREATURE_SIZE / 2;

  // Max offsets to clamp the camera inside the world
  const maxCameraX = WORLD_SIZE - screenWidth;
  const maxCameraY = WORLD_SIZE - screenHeight;

  const cameraX = useRef(new Animated.Value(initialCameraX)).current;
  const cameraY = useRef(new Animated.Value(initialCameraY)).current;

  // JS-side camera values (needed for clamping during pan)
  const cameraXRef = useRef(initialCameraX);
  const cameraYRef = useRef(initialCameraY);

  // Track the camera position at the start of each pan gesture
  const panStartX = useRef(initialCameraX);
  const panStartY = useRef(initialCameraY);

  // Keep JS refs in sync with Animated values
  useEffect(() => {
    const listenerX = cameraX.addListener(({ value }) => {
      cameraXRef.current = value;
    });
    const listenerY = cameraY.addListener(({ value }) => {
      cameraYRef.current = value;
    });
    return () => {
      cameraX.removeListener(listenerX);
      cameraY.removeListener(listenerY);
    };
  }, [cameraX, cameraY]);

  // ── Pan gesture ─────────────────────────────────────────────────────────────

  const onGestureEvent = useCallback(
    (event: GestureEvent<PanGestureHandlerEventPayload>) => {
      const { translationX, translationY } = event.nativeEvent;
      // Subtract translation because dragging right moves the camera left
      const rawX = panStartX.current - translationX;
      const rawY = panStartY.current - translationY;
      const clampedX = Math.max(0, Math.min(maxCameraX, rawX));
      const clampedY = Math.max(0, Math.min(maxCameraY, rawY));
      cameraX.setValue(clampedX);
      cameraY.setValue(clampedY);
    },
    [cameraX, cameraY, maxCameraX, maxCameraY],
  );

  const onHandlerStateChange = useCallback(() => {
    // Snapshot the camera position at the end of each gesture so the next one starts from here
    panStartX.current = cameraXRef.current;
    panStartY.current = cameraYRef.current;
  }, []);

  // ── Food state ──────────────────────────────────────────────────────────────

  const [foodItems, setFoodItems] = useState<FoodItem[]>(buildInitialFood);

  /** Collect a food item, call the store action, then respawn after 3 s. */
  const handleCollectFood = useCallback(
    (id: string) => {
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

  // ── Background colour ───────────────────────────────────────────────────────

  // Lighten the stage colour slightly for the world background
  const stageBgColor = STAGES[stageIndex]?.color ?? STAGES[0].color;

  // ── Creature screen position ────────────────────────────────────────────────

  // These are Animated values for the creature's absolute screen position
  const creatureLeft = Animated.subtract(
    CREATURE_WORLD_X - CREATURE_SIZE / 2,
    cameraX,
  );
  const creatureTop = Animated.subtract(
    CREATURE_WORLD_Y - CREATURE_SIZE / 2,
    cameraY,
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onEnded={onHandlerStateChange}
      onCancelled={onHandlerStateChange}
      onFailed={onHandlerStateChange}
    >
      <Animated.View style={StyleSheet.absoluteFill}>
        {/* ── Background world layer ──────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.worldBackground,
            {
              backgroundColor: lighten(stageBgColor, 0.12),
              left: Animated.multiply(cameraX, -1),
              top: Animated.multiply(cameraY, -1),
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
          const screenLeft = Animated.subtract(dec.worldX - FOOD_ITEM_SIZE / 2, cameraX);
          const screenTop = Animated.subtract(dec.worldY - FOOD_ITEM_SIZE / 2, cameraY);
          return (
            <Animated.View
              key={dec.id}
              style={[styles.decoration, { left: screenLeft, top: screenTop }]}
            >
              <Text style={styles.decorationEmoji}>{dec.emoji}</Text>
            </Animated.View>
          );
        })}

        {/* ── Food items ──────────────────────────────────────────────────── */}
        {foodItems.map((item) => (
          <FoodSprite
            key={item.id}
            item={item}
            onCollect={handleCollectFood}
            cameraX={cameraX}
            cameraY={cameraY}
          />
        ))}

        {/* ── Player creature ──────────────────────────────────────────────── */}
        <Animated.View
          style={[styles.creatureContainer, { left: creatureLeft, top: creatureTop }]}
        >
          <Creature
            stageIndex={stageIndex}
            onPress={onCreatureTap}
            onPressCoordinates={onCreatureTapCoordinates}
          />
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
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
  foodTouchable: {
    width: FOOD_ITEM_SIZE,
    height: FOOD_ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
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
