import React, { useEffect, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";

const ORB_SIZE = 10;
const ORB_GAP = 8;
const DURATION = 500;
const STAGGER = 120;

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

interface AnimatedSplashScreenProps {
  isAppReady: boolean;
  onComplete: () => void;
}

// Orbs use white tones on the dark gradient background
const SplashOrb: React.FC<{ index: number }> = ({ index }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * STAGGER,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: DURATION,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: DURATION,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + progress.value * 0.5 },
      { translateY: -progress.value * 4 },
    ],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(255,255,255,0.4)", "rgba(255,255,255,0.9)"],
    ),
    opacity: 0.45 + progress.value * 0.55,
  }));

  return <Animated.View style={[styles.orb, animatedStyle]} />;
};

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  isAppReady,
  onComplete,
}) => {
  // Entrance animations
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.8);
  const subtitleOpacity = useSharedValue(0);
  const orbsOpacity = useSharedValue(0);

  // Exit animation
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Hide native splash and play entrance animations on mount
  useEffect(() => {
    const start = async () => {
      await SplashScreen.hideAsync();

      // Fade in orbs first
      orbsOpacity.value = withTiming(1, { duration: 400 });

      // Then title fades + scales in
      titleOpacity.value = withDelay(
        200,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
      );
      titleScale.value = withDelay(
        200,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) }),
      );

      // Subtitle fades in last
      subtitleOpacity.value = withDelay(
        700,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }),
      );
    };
    start();
  }, []);

  // Play exit animation when app is ready
  useEffect(() => {
    if (!isAppReady) return;

    // Minimum display time — let entrance finish before fading out
    const exitDelay = 800;

    containerOpacity.value = withDelay(
      exitDelay,
      withTiming(0, { duration: 400, easing: Easing.in(Easing.ease) }, () => {
        runOnJS(handleComplete)();
      }),
    );
    containerScale.value = withDelay(
      exitDelay,
      withTiming(1.05, { duration: 400, easing: Easing.in(Easing.ease) }),
    );
  }, [isAppReady]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const orbsStyle = useAnimatedStyle(() => ({
    opacity: orbsOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={["#126ba3", "#0E5680", "#0A3F5E"]}
        style={styles.gradient}
      >
        {/* Brand title */}
        <Animated.Text style={[styles.title, titleStyle]}>Scout</Animated.Text>

        {/* Animated orbs */}
        <Animated.View style={[styles.orbRow, orbsStyle]}>
          <SplashOrb index={0} />
          <SplashOrb index={1} />
          <SplashOrb index={2} />
          <SplashOrb index={3} />
        </Animated.View>

        {/* Subtitle + version */}
        <Animated.View style={[styles.subtitleContainer, subtitleStyle]}>
          <Animated.Text style={styles.subtitle}>
            powered by FastApply
          </Animated.Text>
          <Animated.Text style={styles.version}>v{APP_VERSION}</Animated.Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
    marginBottom: 24,
  },
  orbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ORB_GAP,
    marginBottom: 48,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
  },
  subtitleContainer: {
    alignItems: "center",
    position: "absolute",
    bottom: 60,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
    marginBottom: 4,
  },
  version: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "400",
  },
});

export default AnimatedSplashScreen;
