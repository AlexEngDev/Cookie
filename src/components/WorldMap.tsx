import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
/** Base world-unit radius within which the creature eats a food item */
const COLLISION_RADIUS = 55;
/** Maximum food collision radius (capped so it doesn't become absurdly large) */
const MAX_FOOD_COLLISION_RADIUS = 130;
/** Creature stops moving once it is within this many world units of the target */
const MOVEMENT_STOP_DIST = 2;

// ─── Player size constants ────────────────────────────────────────────────────

/** Player's baseline size score at zero food collected */
const BASE_PLAYER_SIZE = 30;
/** Size score gained per food unit collected */
const SIZE_PER_FOOD = 0.5;
/** Maximum player size score (caps collision growth) */
const MAX_PLAYER_SIZE = 120;
/** Maximum visual scale applied to the creature sprite (keeps it on screen) */
const MAX_VISUAL_SCALE = 2.5;

// ─── AI entity constants ──────────────────────────────────────────────────────

/** Distance at which prey starts fleeing from the player */
const PREY_SCARE_RADIUS = 200;
/** Distance at which a predator starts chasing the player */
const PREDATOR_AGGRO_RADIUS = 300;
/** Base distance for player ↔ AI collision */
const AI_COLLISION_RADIUS = 50;
/** Maximum AI collision radius */
const MAX_AI_COLLISION_RADIUS = 110;
/** Fixed size score assigned to predator entities */
const PREDATOR_SIZE = 50;
/** Rendered size (px) of the AI emoji container */
const AI_ENTITY_SIZE = 40;
/** Time (ms) before eaten prey respawns */
const PREY_RESPAWN_MS = 5000;
/** Duration (ms) of player invulnerability after a predator hit */
const INVULNERABILITY_MS = 1500;
/** Number of opacity flashes during the invulnerability window */
const INVUL_FLASH_COUNT = 5;
/** Duration (ms) of each half-flash (fade-out or fade-in) — 2 halves × count = INVULNERABILITY_MS */
const INVUL_FLASH_HALF_DURATION = INVULNERABILITY_MS / INVUL_FLASH_COUNT / 2;
/** Minimum distance from world edges for AI entities */
const AI_MARGIN = 60;
/** Probability per frame that a wandering AI picks a new random direction */
const WANDER_CHANGE_CHANCE = 0.008;

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

// ─── AI entity configuration ──────────────────────────────────────────────────

interface AiEntityConfig {
  id: string;
  type: 'prey' | 'predator';
  emoji: string;
  /** World units per frame this entity moves */
  speed: number;
  /** Initial world X position */
  initX: number;
  /** Initial world Y position */
  initY: number;
}

/** Mutable runtime state for each AI entity (kept in a ref, updated every frame) */
interface AiEntityMutable {
  worldX: number;
  worldY: number;
  /** Normalised movement direction */
  dirX: number;
  dirY: number;
  /** False while the entity is respawning (not visible) */
  alive: boolean;
}

/** Fixed set of AI entities: 5 prey + 3 predators, spread around the map */
const AI_ENTITY_CONFIGS: AiEntityConfig[] = [
  // ── Prey ──────────────────────────────────────────────────────────────────
  { id: 'prey_0', type: 'prey', emoji: '🦐', speed: 1.8, initX: 200,  initY: 200  },
  { id: 'prey_1', type: 'prey', emoji: '🐛', speed: 1.5, initX: 900,  initY: 300  },
  { id: 'prey_2', type: 'prey', emoji: '🦠', speed: 2.0, initX: 400,  initY: 900  },
  { id: 'prey_3', type: 'prey', emoji: '🦐', speed: 1.7, initX: 1000, initY: 700  },
  { id: 'prey_4', type: 'prey', emoji: '🐛', speed: 1.6, initX: 300,  initY: 550  },
  // ── Predators ─────────────────────────────────────────────────────────────
  { id: 'pred_0', type: 'predator', emoji: '🦑', speed: 2.2, initX: 150, initY: 950 },
  { id: 'pred_1', type: 'predator', emoji: '🦀', speed: 2.0, initX: 950, initY: 150 },
  { id: 'pred_2', type: 'predator', emoji: '🦈', speed: 2.5, initX: 750, initY: 980 },
];

// ─── Dot-pattern background rows ─────────────────────────────────────────────

const DOT_SPACING = 60;
const DOT_COUNT = Math.floor(WORLD_SIZE / DOT_SPACING);

// ─── Props ───────────────────────────────────────────────────────────────────

interface WorldMapProps {
  /** Current evolution stage index (0–3) */
  stageIndex: number;
  /** Current food count from the game store — drives dynamic size */
  playerFood: number;
  /** Called when a food item is collected (eaten by collision) */
  onFoodCollected: () => void;
  /** Called when the player's creature eats a prey entity */
  onPreyEaten?: () => void;
  /** Called when a predator collides with the player */
  onPredatorHit?: () => void;
  /** Called when the player (now bigger) eats a predator */
  onPredatorEaten?: () => void;
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

// ─── AiSprite ────────────────────────────────────────────────────────────────

interface AiSpriteProps {
  config: AiEntityConfig;
  xAnim: Animated.Value;
  yAnim: Animated.Value;
  alive: boolean;
  cameraX: Animated.Value;
  cameraY: Animated.Value;
}

/**
 * A single AI creature sprite (prey or predator).
 * Its screen position is derived from its Animated world position minus the camera.
 * The component re-renders only when `alive` changes.
 */
const AiSprite: React.FC<AiSpriteProps> = React.memo(
  ({ config, xAnim, yAnim, alive, cameraX, cameraY }) => {
    if (!alive) return null;

    const screenX = Animated.subtract(Animated.subtract(xAnim, AI_ENTITY_SIZE / 2), cameraX);
    const screenY = Animated.subtract(Animated.subtract(yAnim, AI_ENTITY_SIZE / 2), cameraY);

    return (
      <Animated.View
        style={[
          styles.aiEntity,
          { left: screenX, top: screenY },
        ]}
        pointerEvents="none"
      >
        <Text
          style={
            config.type === 'predator' ? styles.predatorEmoji : styles.preyEmoji
          }
        >
          {config.emoji}
        </Text>
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
  playerFood,
  onFoodCollected,
  onPreyEaten = () => {},
  onPredatorHit = () => {},
  onPredatorEaten = () => {},
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

  // ── Player size (derived from playerFood, kept in a ref for the RAF loop) ──

  /**
   * Computed player size score: grows with food collected.
   * Used for collision radius scaling and the predator/prey size hierarchy.
   */
  const getPlayerSize = (food: number) =>
    Math.min(MAX_PLAYER_SIZE, BASE_PLAYER_SIZE + food * SIZE_PER_FOOD);

  /** Ref read by the RAF loop to avoid stale closure over playerFood */
  const playerSizeRef = useRef(getPlayerSize(playerFood));
  useEffect(() => {
    playerSizeRef.current = getPlayerSize(playerFood);
  // getPlayerSize is a pure function; playerFood is the only true dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerFood]);

  /** Visual scale applied to the creature sprite — capped to keep it on-screen */
  const visualScale = useMemo(
    () => Math.min(MAX_VISUAL_SCALE, getPlayerSize(playerFood) / BASE_PLAYER_SIZE),
    // getPlayerSize is a pure module-level function; playerFood is the only dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerFood],
  );

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

  // ── AI entities ──────────────────────────────────────────────────────────────

  /** Mutable runtime state for each AI entity — read/written inside the RAF loop */
  const aiRefs = useRef<AiEntityMutable[]>(
    AI_ENTITY_CONFIGS.map((cfg) => {
      const angle = Math.random() * Math.PI * 2;
      return {
        worldX: cfg.initX,
        worldY: cfg.initY,
        dirX: Math.cos(angle),
        dirY: Math.sin(angle),
        alive: true,
      };
    }),
  );

  /** Animated position values for rendering each AI entity (stable, never recreated) */
  const aiAnims = useRef(
    AI_ENTITY_CONFIGS.map((cfg) => ({
      xAnim: new Animated.Value(cfg.initX),
      yAnim: new Animated.Value(cfg.initY),
    })),
  ).current;

  /**
   * React state mirror of each entity's `alive` flag.
   * Only used to trigger re-renders when an entity spawns or despawns;
   * the RAF loop reads `aiRefs.current[i].alive` for performance.
   */
  const [aiAliveState, setAiAliveState] = useState<boolean[]>(
    () => AI_ENTITY_CONFIGS.map(() => true),
  );

  /** Set to true after a predator hit; cleared when the flash animation ends */
  const invulRef = useRef(false);

  /** Animated opacity used to flash the player creature during invulnerability */
  const invulOpacity = useRef(new Animated.Value(1)).current;

  /**
   * Indices of prey currently mid-respawn.
   * Prevents duplicate collision triggers while the entity is transitioning.
   */
  const respawningPreyRef = useRef(new Set<number>());

  /**
   * Indices of predators currently mid-respawn (eaten by the player).
   * Prevents duplicate collision triggers while the entity is transitioning.
   */
  const respawningPredatorRef = useRef(new Set<number>());

  /** Stable refs for callbacks so the RAF loop always calls the latest version */
  const onPreyEatenRef = useRef(onPreyEaten);
  useEffect(() => {
    onPreyEatenRef.current = onPreyEaten;
  }, [onPreyEaten]);

  const onPredatorHitRef = useRef(onPredatorHit);
  useEffect(() => {
    onPredatorHitRef.current = onPredatorHit;
  }, [onPredatorHit]);

  const onPredatorEatenRef = useRef(onPredatorEaten);
  useEffect(() => {
    onPredatorEatenRef.current = onPredatorEaten;
  }, [onPredatorEaten]);

  // ── requestAnimationFrame movement loop ─────────────────────────────────────

  const rafRef = useRef<number | null>(null);

  /**
   * Shared helper: immediately despawn an AI entity, fire its "eaten" callback,
   * then respawn it at a random position after PREY_RESPAWN_MS milliseconds.
   * Used for both prey and predator entities that the player eats.
   */
  const despawnAndRespawn = useCallback(
    (
      index: number,
      trackingSet: React.MutableRefObject<Set<number>>,
      onEaten: React.MutableRefObject<() => void>,
    ) => {
      const entity = aiRefs.current[index];
      entity.alive = false;
      trackingSet.current.add(index);
      setAiAliveState((prev) => prev.map((v, idx) => (idx === index ? false : v)));
      onEaten.current();

      setTimeout(() => {
        const spawnX = AI_MARGIN + Math.random() * (WORLD_SIZE - AI_MARGIN * 2);
        const spawnY = AI_MARGIN + Math.random() * (WORLD_SIZE - AI_MARGIN * 2);
        const angle = Math.random() * Math.PI * 2;
        entity.worldX = spawnX;
        entity.worldY = spawnY;
        entity.dirX = Math.cos(angle);
        entity.dirY = Math.sin(angle);
        entity.alive = true;
        aiAnims[index].xAnim.setValue(spawnX);
        aiAnims[index].yAnim.setValue(spawnY);
        trackingSet.current.delete(index);
        setAiAliveState((prev) => prev.map((v, idx) => (idx === index ? true : v)));
      }, PREY_RESPAWN_MS);
    },
    // Dependencies are all guaranteed stable:
    //   aiRefs   — created with useRef, identity never changes
    //   aiAnims  — created once via useRef(...).current, array is never recreated
    //   setAiAliveState — React guarantees state-setter identity is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /** Stable ref so the RAF loop always calls the latest despawnAndRespawn */
  const despawnAndRespawnRef = useRef(despawnAndRespawn);
  useEffect(() => {
    despawnAndRespawnRef.current = despawnAndRespawn;
  }, [despawnAndRespawn]);

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

      // ── Dynamic radii based on current player size ────────────────────────
      const pSize = playerSizeRef.current;
      const sizeRatio = pSize / BASE_PLAYER_SIZE;
      const dynFoodRadius = Math.min(MAX_FOOD_COLLISION_RADIUS, COLLISION_RADIUS * sizeRatio);
      const dynAiRadius = Math.min(MAX_AI_COLLISION_RADIUS, AI_COLLISION_RADIUS * sizeRatio);

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

        // ── Collision detection (food) ──────────────────────────────────────
        for (const food of foodItemsRef.current) {
          if (food.collected || collectingIdsRef.current.has(food.id)) continue;
          const fdx = food.worldX - newX;
          const fdy = food.worldY - newY;
          if (fdx * fdx + fdy * fdy < dynFoodRadius * dynFoodRadius) {
            handleCollectFoodRef.current(food.id);
          }
        }
      }

      // ── AI entity update (runs every frame regardless of player movement) ──
      const playerX = creatureXRef.current;
      const playerY = creatureYRef.current;
      const playerBiggerThanPredator = playerSizeRef.current > PREDATOR_SIZE;

      for (let i = 0; i < aiRefs.current.length; i++) {
        const entity = aiRefs.current[i];
        if (!entity.alive) continue;

        const config = AI_ENTITY_CONFIGS[i];
        const pdx = playerX - entity.worldX;
        const pdy = playerY - entity.worldY;
        const pDistSq = pdx * pdx + pdy * pdy;
        const pDist = Math.sqrt(pDistSq);

        if (config.type === 'prey') {
          if (pDist < PREY_SCARE_RADIUS && pDist > 0) {
            // Flee: run directly away from the player
            entity.dirX = -pdx / pDist;
            entity.dirY = -pdy / pDist;
          } else if (Math.random() < WANDER_CHANGE_CHANCE) {
            // Occasionally pick a new random wander direction
            const angle = Math.random() * Math.PI * 2;
            entity.dirX = Math.cos(angle);
            entity.dirY = Math.sin(angle);
          }
        } else {
          // Predator: behaviour flips based on size hierarchy
          if (pDist < PREDATOR_AGGRO_RADIUS && pDist > 0) {
            if (playerBiggerThanPredator) {
              // Player is now bigger — predator flees!
              entity.dirX = -pdx / pDist;
              entity.dirY = -pdy / pDist;
            } else {
              // Normal: predator chases the player
              entity.dirX = pdx / pDist;
              entity.dirY = pdy / pDist;
            }
          } else if (Math.random() < WANDER_CHANGE_CHANCE) {
            const angle = Math.random() * Math.PI * 2;
            entity.dirX = Math.cos(angle);
            entity.dirY = Math.sin(angle);
          }
        }

        // Move entity at its configured speed
        let nextX = entity.worldX + entity.dirX * config.speed;
        let nextY = entity.worldY + entity.dirY * config.speed;

        // Bounce off world edges
        if (nextX < AI_MARGIN) {
          nextX = AI_MARGIN;
          entity.dirX = Math.abs(entity.dirX);
        } else if (nextX > WORLD_SIZE - AI_MARGIN) {
          nextX = WORLD_SIZE - AI_MARGIN;
          entity.dirX = -Math.abs(entity.dirX);
        }
        if (nextY < AI_MARGIN) {
          nextY = AI_MARGIN;
          entity.dirY = Math.abs(entity.dirY);
        } else if (nextY > WORLD_SIZE - AI_MARGIN) {
          nextY = WORLD_SIZE - AI_MARGIN;
          entity.dirY = -Math.abs(entity.dirY);
        }

        entity.worldX = nextX;
        entity.worldY = nextY;

        // Sync position Animated values for rendering
        aiAnims[i].xAnim.setValue(nextX);
        aiAnims[i].yAnim.setValue(nextY);

        // ── Collision: AI ↔ player ──────────────────────────────────────────
        if (pDistSq < dynAiRadius * dynAiRadius) {
          if (config.type === 'prey' && !respawningPreyRef.current.has(i)) {
            // Prey eaten by player: despawn, award food, respawn after delay
            despawnAndRespawnRef.current(i, respawningPreyRef, onPreyEatenRef);
          } else if (config.type === 'predator') {
            if (playerBiggerThanPredator && !respawningPredatorRef.current.has(i)) {
              // Player is bigger: eat the predator, award bonus food, respawn it
              despawnAndRespawnRef.current(i, respawningPredatorRef, onPredatorEatenRef);
            } else if (!playerBiggerThanPredator && !invulRef.current) {
              // Player is smaller: predator damages the player
              invulRef.current = true;
              onPredatorHitRef.current();
              Animated.loop(
                Animated.sequence([
                  Animated.timing(invulOpacity, {
                    toValue: 0.25,
                    duration: INVUL_FLASH_HALF_DURATION,
                    useNativeDriver: true,
                  }),
                  Animated.timing(invulOpacity, {
                    toValue: 1,
                    duration: INVUL_FLASH_HALF_DURATION,
                    useNativeDriver: true,
                  }),
                ]),
                { iterations: INVUL_FLASH_COUNT },
              ).start(() => {
                invulOpacity.setValue(1);
                invulRef.current = false;
              });
            }
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

        {/* ── AI entities (prey and predators) ────────────────────────────── */}
        {AI_ENTITY_CONFIGS.map((config, i) => (
          <AiSprite
            key={config.id}
            config={config}
            xAnim={aiAnims[i].xAnim}
            yAnim={aiAnims[i].yAnim}
            alive={aiAliveState[i]}
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
              opacity: invulOpacity,
              transform: [{ rotate: creatureRotate }, { scale: visualScale }],
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
  aiEntity: {
    position: 'absolute',
    width: AI_ENTITY_SIZE,
    height: AI_ENTITY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  preyEmoji: {
    fontSize: 22,
  },
  predatorEmoji: {
    fontSize: 28,
  },
});

export default WorldMap;
