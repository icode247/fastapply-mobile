import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../hooks";

// Import the logo
const logo = require("../../../assets/icons/scout-icon.png");

interface LoadingScreenProps {
  message?: string;
  overlay?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  overlay = false,
}) => {
  const { colors, isDark } = useTheme();
  const pulse = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Smooth breathing scale animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.95, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );

    // Spinning ring animation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const backgroundColor = overlay
    ? isDark
      ? "rgba(0, 0, 0, 0.85)"
      : "rgba(255, 255, 255, 0.92)"
    : colors.background;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.loaderWrapper}>
        {/* Logo with breathing animation */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </Animated.View>
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
  loaderWrapper: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
});

export default LoadingScreen;
