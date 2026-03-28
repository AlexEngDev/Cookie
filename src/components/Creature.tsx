import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, Line, Polygon, G } from 'react-native-svg';

interface CreatureProps {
  /** Index of the current evolution stage (0–3) */
  stageIndex: number;
  /** Handler called when the creature is tapped */
  onPress: () => void;
}

// ─── Stage 0: Microbe ────────────────────────────────────────────────────────
// A round green blob with wiggly cilia tentacles radiating outward.
const MicrobeCreature = () => (
  <Svg width="200" height="200" viewBox="0 0 200 200">
    {/* Glow halo */}
    <Circle cx="100" cy="100" r="72" fill="rgba(52,211,153,0.18)" />
    {/* Cilia — 8 tentacles at evenly spaced angles */}
    <G stroke="#0d9488" strokeWidth="3" strokeLinecap="round">
      <Line x1="100" y1="100" x2="100" y2="22" />
      <Line x1="100" y1="100" x2="157" y2="43" />
      <Line x1="100" y1="100" x2="178" y2="100" />
      <Line x1="100" y1="100" x2="157" y2="157" />
      <Line x1="100" y1="100" x2="100" y2="178" />
      <Line x1="100" y1="100" x2="43" y2="157" />
      <Line x1="100" y1="100" x2="22" y2="100" />
      <Line x1="100" y1="100" x2="43" y2="43" />
    </G>
    {/* Small bulbs at the tip of each cilium */}
    <G fill="#34d399">
      <Circle cx="100" cy="22" r="5" />
      <Circle cx="157" cy="43" r="5" />
      <Circle cx="178" cy="100" r="5" />
      <Circle cx="157" cy="157" r="5" />
      <Circle cx="100" cy="178" r="5" />
      <Circle cx="43" cy="157" r="5" />
      <Circle cx="22" cy="100" r="5" />
      <Circle cx="43" cy="43" r="5" />
    </G>
    {/* Main body blob */}
    <Ellipse cx="100" cy="100" rx="54" ry="58" fill="#10b981" />
    <Ellipse cx="100" cy="100" rx="46" ry="50" fill="#34d399" />
    {/* Eye */}
    <Circle cx="112" cy="88" r="10" fill="white" />
    <Circle cx="114" cy="90" r="5" fill="#065f46" />
    <Circle cx="116" cy="88" r="2" fill="white" />
    {/* Smile */}
    <Path
      d="M 88 110 Q 100 120 112 110"
      stroke="#065f46"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    {/* Inner cell nucleus detail */}
    <Ellipse cx="88" cy="105" rx="12" ry="8" fill="rgba(6,95,70,0.25)" />
  </Svg>
);

// ─── Stage 1: Creature ───────────────────────────────────────────────────────
// A fish/tadpole shape swimming to the right, with an eye and tail fin.
const FishCreature = () => (
  <Svg width="200" height="200" viewBox="0 0 200 200">
    {/* Glow halo */}
    <Ellipse cx="100" cy="105" rx="70" ry="58" fill="rgba(99,102,241,0.18)" />
    {/* Tail fin */}
    <Polygon
      points="42,80 20,60 20,150 42,130"
      fill="#6366f1"
    />
    {/* Body */}
    <Ellipse cx="112" cy="105" rx="62" ry="42" fill="#3b82f6" />
    <Ellipse cx="112" cy="105" rx="54" ry="34" fill="#60a5fa" />
    {/* Dorsal fin */}
    <Polygon
      points="90,63 115,48 140,63"
      fill="#4f46e5"
    />
    {/* Pectoral fin */}
    <Polygon
      points="110,115 130,135 90,130"
      fill="#4f46e5"
    />
    {/* Snout highlight */}
    <Ellipse cx="168" cy="102" rx="12" ry="9" fill="#93c5fd" />
    {/* Eye */}
    <Circle cx="152" cy="94" r="12" fill="white" />
    <Circle cx="155" cy="96" r="6" fill="#1e1b4b" />
    <Circle cx="157" cy="94" r="2.5" fill="white" />
    {/* Scales detail */}
    <Path
      d="M 105 88 Q 118 80 130 88"
      stroke="#2563eb"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M 85 100 Q 98 92 110 100"
      stroke="#2563eb"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M 105 112 Q 118 104 130 112"
      stroke="#2563eb"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

// ─── Stage 2: Animal ─────────────────────────────────────────────────────────
// A four-legged lizard/amphibian with a long tail, orange and red tones.
const LizardCreature = () => (
  <Svg width="200" height="200" viewBox="0 0 200 200">
    {/* Glow halo */}
    <Ellipse cx="100" cy="110" rx="72" ry="55" fill="rgba(251,146,60,0.18)" />
    {/* Tail */}
    <Path
      d="M 56 120 Q 20 145 10 175"
      stroke="#c2410c"
      strokeWidth="10"
      fill="none"
      strokeLinecap="round"
    />
    {/* Rear legs */}
    <Path
      d="M 80 135 L 62 160 L 55 170"
      stroke="#ea580c"
      strokeWidth="9"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M 110 135 L 128 160 L 135 170"
      stroke="#ea580c"
      strokeWidth="9"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Body */}
    <Ellipse cx="96" cy="118" rx="52" ry="30" fill="#f97316" />
    <Ellipse cx="96" cy="118" rx="44" ry="22" fill="#fb923c" />
    {/* Front legs */}
    <Path
      d="M 75 105 L 57 80 L 50 70"
      stroke="#ea580c"
      strokeWidth="9"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M 115 105 L 133 80 L 140 70"
      stroke="#ea580c"
      strokeWidth="9"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Neck */}
    <Ellipse cx="138" cy="102" rx="22" ry="15" fill="#f97316" />
    {/* Head */}
    <Ellipse cx="160" cy="90" rx="24" ry="18" fill="#fb923c" />
    <Ellipse cx="160" cy="90" rx="18" ry="13" fill="#fdba74" />
    {/* Eye */}
    <Circle cx="167" cy="84" r="7" fill="white" />
    <Circle cx="169" cy="86" r="4" fill="#431407" />
    <Circle cx="170" cy="85" r="1.5" fill="white" />
    {/* Nostril */}
    <Circle cx="178" cy="91" r="2.5" fill="#c2410c" />
    {/* Spine ridge */}
    <Path
      d="M 85 100 Q 96 92 107 100 Q 118 92 129 100"
      stroke="#c2410c"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </Svg>
);

// ─── Stage 3: Mind ───────────────────────────────────────────────────────────
// An upright humanoid silhouette with a visible glowing brain and golden aura.
const MindCreature = () => (
  <Svg width="200" height="200" viewBox="0 0 200 200">
    {/* Outer aura rings */}
    <Circle cx="100" cy="90" r="85" fill="rgba(250,204,21,0.08)" />
    <Circle cx="100" cy="90" r="68" fill="rgba(250,204,21,0.14)" />
    <Circle cx="100" cy="90" r="54" fill="rgba(250,204,21,0.20)" />
    {/* Body torso */}
    <Ellipse cx="100" cy="148" rx="28" ry="38" fill="#b45309" />
    <Ellipse cx="100" cy="148" rx="20" ry="30" fill="#d97706" />
    {/* Arms */}
    <Path
      d="M 72 128 Q 52 140 44 158"
      stroke="#b45309"
      strokeWidth="10"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M 128 128 Q 148 140 156 158"
      stroke="#b45309"
      strokeWidth="10"
      fill="none"
      strokeLinecap="round"
    />
    {/* Legs */}
    <Path
      d="M 88 180 L 82 196"
      stroke="#92400e"
      strokeWidth="11"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M 112 180 L 118 196"
      stroke="#92400e"
      strokeWidth="11"
      fill="none"
      strokeLinecap="round"
    />
    {/* Neck */}
    <Ellipse cx="100" cy="110" rx="12" ry="10" fill="#d97706" />
    {/* Head */}
    <Circle cx="100" cy="88" r="32" fill="#fbbf24" />
    <Circle cx="100" cy="88" r="26" fill="#fde68a" />
    {/* Brain folds visible through the head */}
    <Path
      d="M 82 78 Q 90 68 100 72 Q 110 68 118 78 Q 122 88 118 96 Q 110 104 100 100 Q 90 104 82 96 Q 78 88 82 78"
      fill="rgba(234,88,12,0.30)"
      stroke="#f97316"
      strokeWidth="1.5"
    />
    <Path
      d="M 100 72 Q 100 86 100 100"
      stroke="#f97316"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M 84 82 Q 92 78 100 82 Q 108 78 116 82"
      stroke="#f97316"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
    />
    <Path
      d="M 84 92 Q 92 88 100 92 Q 108 88 116 92"
      stroke="#f97316"
      strokeWidth="1.2"
      fill="none"
      strokeLinecap="round"
    />
    {/* Eyes */}
    <Circle cx="90" cy="88" r="5" fill="white" />
    <Circle cx="110" cy="88" r="5" fill="white" />
    <Circle cx="91" cy="89" r="3" fill="#1c1917" />
    <Circle cx="111" cy="89" r="3" fill="#1c1917" />
    <Circle cx="92" cy="88" r="1.2" fill="white" />
    <Circle cx="112" cy="88" r="1.2" fill="white" />
    {/* Smile */}
    <Path
      d="M 90 98 Q 100 106 110 98"
      stroke="#92400e"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    {/* Crown glow sparks */}
    <Path d="M 100 56 L 97 46 L 100 50 L 103 46 Z" fill="#fbbf24" />
    <Path d="M 78 64 L 72 56 L 77 61 L 74 53 Z" fill="#fbbf24" />
    <Path d="M 122 64 L 128 56 L 123 61 L 126 53 Z" fill="#fbbf24" />
  </Svg>
);

// Map of stage index → SVG creature component
const CREATURE_BY_STAGE: Record<number, React.ReactElement> = {
  0: <MicrobeCreature />,
  1: <FishCreature />,
  2: <LizardCreature />,
  3: <MindCreature />,
};

/**
 * Creature component — displays an SVG creature for the current evolution stage.
 * Plays a continuous idle breathing animation and a tap pulse animation on press.
 */
const Creature: React.FC<CreatureProps> = ({ stageIndex, onPress }) => {
  // Scale value used for the tap pulse animation
  const tapScale = useRef(new Animated.Value(1)).current;
  // Scale value used for the idle breathing animation
  const breathScale = useRef(new Animated.Value(1)).current;

  // Start the idle breathing loop when the component mounts
  useEffect(() => {
    const breathingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathScale, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(breathScale, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    breathingLoop.start();
    return () => breathingLoop.stop();
  }, [breathScale]);

  /** Play a quick scale-down-then-spring-back animation on tap, then call onPress */
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(tapScale, {
        toValue: 0.82,
        duration: 75,
        useNativeDriver: true,
      }),
      Animated.spring(tapScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  // Combine tap and breathing scales so both animations run without conflict
  const combinedScale = Animated.multiply(tapScale, breathScale);

  const creatureSvg = CREATURE_BY_STAGE[stageIndex] ?? CREATURE_BY_STAGE[0];

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.container}>
      <Animated.View style={[styles.wrapper, { transform: [{ scale: combinedScale }] }]}>
        {creatureSvg}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Creature;

