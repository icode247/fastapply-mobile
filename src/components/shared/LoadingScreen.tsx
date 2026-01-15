import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";

// Import the logo
const logo = require("../../../assets/full-logo.png");

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const { colors } = useTheme();
  const opacity = useSharedValue(1);

  // Start pulsing animation on mount
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.5, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // infinite repeats
      true // reverse on each iteration
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.spinnerContainer}>
        <Animated.View style={[styles.logoContainer, animatedStyle]}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </Animated.View>
      </View>
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
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
  spinnerContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  message: {
    marginTop: spacing[4],
    fontSize: typography.fontSize.base,
  },
});

export default LoadingScreen;
