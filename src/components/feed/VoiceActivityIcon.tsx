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

interface VoiceActivityIconProps {
  color?: string;
  barCount?: number;
}

const AnimatedBar = ({ delay, color }: { delay: number; color: string }) => {
  const height = useSharedValue(10);

  useEffect(() => {
    height.value = withRepeat(
      withSequence(
        withTiming(15 + Math.random() * 15, {
          duration: 150 + Math.random() * 100,
          easing: Easing.ease,
        }),
        withTiming(8 + Math.random() * 5, {
          duration: 150 + Math.random() * 100,
          easing: Easing.ease,
        }),
        withTiming(20 + Math.random() * 10, {
          duration: 150 + Math.random() * 100,
          easing: Easing.ease,
        })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    height: height.value,
    backgroundColor: color,
  }));

  return <Animated.View style={[styles.bar, style]} />;
};

export const VoiceActivityIcon: React.FC<VoiceActivityIconProps> = ({
  color = "#FFFFFF",
  barCount = 4,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: barCount }).map((_, i) => (
        <AnimatedBar key={i} delay={i * 100} color={color} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: 32,
    width: 32,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});
