// ScoutFloatingButton - Always-visible floating button for activating Scout

import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks";
import { useScoutStore } from "../../stores/scout.store";
import { shadows } from "../../constants/theme";

const BUTTON_SIZE = 56;

interface ScoutFloatingButtonProps {
  onPress: () => void;
  wakeWordActive?: boolean;
}

export const ScoutFloatingButton: React.FC<ScoutFloatingButtonProps> = ({
  onPress,
  wakeWordActive = false,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { isOverlayVisible } = useScoutStore();

  // Subtle pulse when wake word is active
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (wakeWordActive) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 1500, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 }),
        ),
        -1,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
          withTiming(0.3, { duration: 0 }),
        ),
        -1,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [wakeWordActive]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // Hide when overlay is active
  if (isOverlayVisible) return null;

  // Position above tab bar
  const bottomOffset = Platform.OS === "ios" ? insets.bottom + 70 : 80;

  return (
    <View style={[styles.container, { bottom: bottomOffset, right: 16 }]}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          { backgroundColor: colors.primary },
          pulseStyle,
        ]}
      />

      {/* Button */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
            borderColor: isDark ? colors.border : colors.borderLight,
            transform: [{ scale: pressed ? 0.92 : 1 }],
          },
          Platform.OS === "ios" && shadows.lg,
          Platform.OS === "android" && { elevation: 8 },
        ]}
      >
        <MaterialCommunityIcons
          name="waveform"
          size={28}
          color={colors.primary}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});
