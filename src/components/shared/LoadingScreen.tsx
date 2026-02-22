import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../hooks";

interface LoadingScreenProps {
  message?: string;
  overlay?: boolean;
}

const ORB_SIZE = 10;
const ORB_GAP = 8;
const DURATION = 500;
const STAGGER = 120;

const Orb: React.FC<{ index: number }> = ({ index }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * STAGGER,
      withRepeat(
        withSequence(
          withTiming(1, { duration: DURATION, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: DURATION, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: 1 + progress.value * 0.5 },
        { translateY: -progress.value * 4 },
      ],
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        ["#7FBAD8", "#126BA3"],
      ),
      opacity: 0.45 + progress.value * 0.55,
    };
  });

  return <Animated.View style={[styles.orb, animatedStyle]} />;
};

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  overlay = false,
}) => {
  const { colors, isDark } = useTheme();

  const backgroundColor = overlay
    ? isDark
      ? "rgba(0, 0, 0, 0.85)"
      : "rgba(255, 255, 255, 0.92)"
    : colors.background;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.orbRow}>
        <Orb index={0} />
        <Orb index={1} />
        <Orb index={2} />
        <Orb index={3} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  orbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ORB_GAP,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: "#126BA3",
  },
});

export default LoadingScreen;
