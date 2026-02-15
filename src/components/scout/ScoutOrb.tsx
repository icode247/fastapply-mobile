// ScoutOrb - Animated orb using Reanimated + LinearGradient (no Skia Canvas)

import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ScoutPhase } from "../../types/voice.types";

const ORB_SIZE = 180;

interface ScoutOrbProps {
  phase: ScoutPhase;
  audioLevel: number; // 0-1
}

// Color palettes per phase
const PHASE_GRADIENTS: Record<
  ScoutPhase,
  { colors: [string, string, string]; glow: string }
> = {
  idle: {
    colors: ["#81D4FA", "#29B6F6", "#0288D1"],
    glow: "rgba(79, 195, 247, 0.25)",
  },
  listening: {
    colors: ["#80DEEA", "#4FC3F7", "#0288D1"],
    glow: "rgba(79, 195, 247, 0.4)",
  },
  thinking: {
    colors: ["#CE93D8", "#B388FF", "#7C4DFF"],
    glow: "rgba(179, 136, 255, 0.4)",
  },
  speaking: {
    colors: ["#A5D6A7", "#69F0AE", "#00E676"],
    glow: "rgba(105, 240, 174, 0.4)",
  },
  done: {
    colors: ["#81D4FA", "#29B6F6", "#0288D1"],
    glow: "rgba(79, 195, 247, 0.2)",
  },
};

export const ScoutOrb: React.FC<ScoutOrbProps> = ({ phase, audioLevel }) => {
  // Animation shared values
  const breathe = useSharedValue(1);
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const audioScale = useSharedValue(1);

  // Breathing animation (always on)
  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1.06, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.94, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
  }, []);

  // Phase-specific animations
  useEffect(() => {
    switch (phase) {
      case "listening":
        rotation.value = withRepeat(
          withTiming(360, { duration: 8000, easing: Easing.linear }),
          -1,
        );
        glowOpacity.value = withTiming(0.5, { duration: 400 });
        pulseScale.value = withTiming(1, { duration: 200 });
        break;

      case "thinking":
        rotation.value = withRepeat(
          withTiming(360, { duration: 3000, easing: Easing.linear }),
          -1,
        );
        pulseScale.value = withRepeat(
          withSequence(
            withTiming(1.08, { duration: 400 }),
            withTiming(0.92, { duration: 400 }),
          ),
          -1,
          true,
        );
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.6, { duration: 500 }),
            withTiming(0.3, { duration: 500 }),
          ),
          -1,
          true,
        );
        break;

      case "speaking":
        rotation.value = withRepeat(
          withTiming(360, { duration: 6000, easing: Easing.linear }),
          -1,
        );
        pulseScale.value = withTiming(1, { duration: 200 });
        glowOpacity.value = withTiming(0.5, { duration: 300 });
        break;

      default:
        rotation.value = withRepeat(
          withTiming(360, { duration: 12000, easing: Easing.linear }),
          -1,
        );
        pulseScale.value = withTiming(1, { duration: 300 });
        glowOpacity.value = withTiming(0.25, { duration: 400 });
        break;
    }
  }, [phase]);

  // Audio-reactive scale
  useEffect(() => {
    if (phase === "listening" || phase === "speaking") {
      audioScale.value = withTiming(1 + audioLevel * 0.15, { duration: 100 });
    } else {
      audioScale.value = withTiming(1, { duration: 200 });
    }
  }, [audioLevel, phase]);

  // Orb container animation
  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breathe.value * pulseScale.value * audioScale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  // Glow ring animation
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value * 1.25 * audioScale.value }],
    opacity: glowOpacity.value,
  }));

  // Inner highlight animation (counter-rotate for liquid feel)
  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-rotation.value * 0.5}deg` }],
  }));

  const gradient = PHASE_GRADIENTS[phase];

  return (
    <View style={styles.container}>
      {/* Glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          { backgroundColor: gradient.glow },
          glowStyle,
        ]}
      />

      {/* Main orb */}
      <Animated.View style={[styles.orbOuter, orbStyle]}>
        <LinearGradient
          colors={gradient.colors}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.orbGradient}
        >
          {/* Inner highlight blob */}
          <Animated.View style={[styles.highlight, highlightStyle]}>
            <LinearGradient
              colors={["rgba(255,255,255,0.5)", "rgba(255,255,255,0)"]}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={styles.highlightGradient}
            />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  glowRing: {
    position: "absolute",
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
  },
  orbOuter: {
    width: ORB_SIZE * 0.75,
    height: ORB_SIZE * 0.75,
    borderRadius: (ORB_SIZE * 0.75) / 2,
    overflow: "hidden",
  },
  orbGradient: {
    flex: 1,
    borderRadius: (ORB_SIZE * 0.75) / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  highlight: {
    position: "absolute",
    top: "10%",
    left: "15%",
    width: "50%",
    height: "50%",
    borderRadius: ORB_SIZE,
    overflow: "hidden",
  },
  highlightGradient: {
    flex: 1,
    borderRadius: ORB_SIZE,
  },
});
