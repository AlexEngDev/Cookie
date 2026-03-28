import React, { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

// Stage-themed particle configuration (color + visual style per evolution stage)
const STAGE_CONFIG = [
  // Stage 0: Microbe — green
  { color: '#34d399' },
  // Stage 1: Creature — blue
  { color: '#60a5fa' },
  // Stage 2: Animal — orange
  { color: '#fb923c' },
  // Stage 3: Mind — gold
  { color: '#fbbf24' },
];

/** Number of particles spawned per tap */
const PARTICLES_PER_TAP = 8;
/** Maximum simultaneous particles allowed on screen */
const MAX_PARTICLES = 20;

interface Particle {
  id: string;
  /** Horizontal offset animated value (starts at 0, moves to target dx) */
  x: Animated.Value;
  /** Vertical offset animated value (starts at 0, moves to target dy) */
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  /** Absolute screen X of the tap centre */
  startX: number;
  /** Absolute screen Y of the tap centre */
  startY: number;
  color: string;
}

interface FloatingText {
  id: string;
  /** Vertical offset for the rise animation */
  y: Animated.Value;
  opacity: Animated.Value;
  startX: number;
  startY: number;
  text: string;
  color: string;
}

/** Ref handle exposed by ParticleSystem — call spawnParticles to trigger the effect */
export interface ParticleSystemRef {
  spawnParticles: (x: number, y: number) => void;
}

interface ParticleSystemProps {
  /** Current evolution stage index (0–3), used to pick the correct theme color */
  stageIndex: number;
  /** Amount of food gained per click, shown in the floating "+N" text */
  clickPower: number;
}

// Monotonically increasing counter used to generate unique particle IDs
let idCounter = 0;
const nextId = () => String(++idCounter);

/**
 * ParticleSystem — renders animated particles and a floating "+N food" label
 * when spawnParticles() is called via the forwarded ref.
 *
 * The component covers the full parent area with position:absolute and
 * pointerEvents="none" so it never blocks touch events on other UI elements.
 */
const ParticleSystem = forwardRef<ParticleSystemRef, ParticleSystemProps>(
  ({ stageIndex, clickPower }, ref) => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

    const spawnParticles = useCallback(
      (tapX: number, tapY: number) => {
        const config = STAGE_CONFIG[stageIndex] ?? STAGE_CONFIG[0];

        // ── Build particles ────────────────────────────────────────────────
        const newParticles: Particle[] = [];

        for (let i = 0; i < PARTICLES_PER_TAP; i++) {
          const id = nextId();

          // Spread evenly around a circle with a small random jitter
          const baseAngle = (Math.PI * 2 * i) / PARTICLES_PER_TAP;
          const angle = baseAngle + (Math.random() - 0.5) * 0.6;
          const distance = 70 + Math.random() * 70; // 70–140 px

          // Bias the motion slightly upward so particles feel like food flying up
          const targetDX = Math.cos(angle) * distance;
          const targetDY = Math.sin(angle) * distance - 40;

          const x = new Animated.Value(0);
          const y = new Animated.Value(0);
          const opacity = new Animated.Value(1);
          const scale = new Animated.Value(1);

          const duration = 600 + Math.random() * 200; // 600–800 ms

          Animated.parallel([
            Animated.timing(x, { toValue: targetDX, duration, useNativeDriver: true }),
            Animated.timing(y, { toValue: targetDY, duration, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 0.3, duration, useNativeDriver: true }),
          ]).start(() => {
            // Remove this particle once its animation completes
            setParticles((prev) => prev.filter((p) => p.id !== id));
          });

          newParticles.push({ id, x, y, opacity, scale, startX: tapX, startY: tapY, color: config.color });
        }

        // ── Build floating "+N" text ───────────────────────────────────────
        const textId = nextId();
        const textY = new Animated.Value(0);
        const textOpacity = new Animated.Value(1);

        Animated.parallel([
          Animated.timing(textY, { toValue: -90, duration: 800, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(textOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
        ]).start(() => {
          setFloatingTexts((prev) => prev.filter((t) => t.id !== textId));
        });

        const newText: FloatingText = {
          id: textId,
          y: textY,
          opacity: textOpacity,
          startX: tapX,
          startY: tapY,
          text: `+${Math.round(clickPower)}`,
          color: config.color,
        };

        // ── Update state, capping at MAX_PARTICLES ─────────────────────────
        setParticles((prev) => {
          const combined = [...prev, ...newParticles];
          // Drop oldest particles if the cap is exceeded
          return combined.length > MAX_PARTICLES ? combined.slice(combined.length - MAX_PARTICLES) : combined;
        });
        setFloatingTexts((prev) => [...prev, newText]);
      },
      [stageIndex, clickPower]
    );

    useImperativeHandle(ref, () => ({ spawnParticles }), [spawnParticles]);

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Render animated particles */}
        {particles.map((p) => (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                // Centre the 12 px circle on the tap location
                left: p.startX - 6,
                top: p.startY - 6,
                backgroundColor: p.color,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { scale: p.scale },
                ],
                opacity: p.opacity,
              },
            ]}
          />
        ))}

        {/* Render floating "+N food" labels */}
        {floatingTexts.map((t) => (
          <Animated.Text
            key={t.id}
            style={[
              styles.floatingText,
              {
                // Horizontally centre the label on the tap location
                left: t.startX - 30,
                top: t.startY - 20,
                color: t.color,
                transform: [{ translateY: t.y }],
                opacity: t.opacity,
              },
            ]}
          >
            {t.text}
          </Animated.Text>
        ))}
      </View>
    );
  }
);

ParticleSystem.displayName = 'ParticleSystem';

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  floatingText: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: 'bold',
    width: 60,
    textAlign: 'center',
  },
});

export default ParticleSystem;
