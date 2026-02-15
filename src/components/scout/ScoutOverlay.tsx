// ScoutOverlay - Full-screen voice UI for Scout assistant

import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../hooks";
import { useScoutStore } from "../../stores/scout.store";
import { ScoutOrb } from "./ScoutOrb";
import { Text } from "../ui/Text";

export const ScoutOverlay: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { isOverlayVisible, phase, audioLevel, deactivate } =
    useScoutStore();

  // Auto-dismiss when phase reaches "done"
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase === "done") {
      dismissTimer.current = setTimeout(() => {
        deactivate();
      }, 1500);
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, [phase, deactivate]);

  // Dots animation for thinking phase
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    if (phase === "thinking") {
      dot1.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
      );
      dot2.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 150 }),
          withTiming(-8, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
      );
      dot3.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 300 }),
          withTiming(-8, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
      );
    } else {
      dot1.value = 0;
      dot2.value = 0;
      dot3.value = 0;
    }
  }, [phase]);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  const handleClose = () => {
    deactivate();
  };

  const renderPhaseText = () => {
    switch (phase) {
      case "listening":
        return (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text style={[styles.phaseText, { color: colors.textSecondary }]}>
              Listening...
            </Text>
          </Animated.View>
        );

      case "thinking":
        return (
          <View style={styles.dotsRow}>
            <Animated.View
              style={[styles.dot, { backgroundColor: colors.textTertiary }, dot1Style]}
            />
            <Animated.View
              style={[styles.dot, { backgroundColor: colors.textTertiary }, dot2Style]}
            />
            <Animated.View
              style={[styles.dot, { backgroundColor: colors.textTertiary }, dot3Style]}
            />
          </View>
        );

      case "speaking":
      case "done":
        // No text — Scout just speaks, orb animates
        return null;

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={isOverlayVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Background */}
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={50}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? "rgba(0, 0, 0, 0.92)"
                  : "rgba(255, 255, 255, 0.95)",
              },
            ]}
          />
        )}

        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 16 }]}
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={28} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Main content */}
        <View style={styles.content}>
          {/* Orb */}
          <View style={styles.orbWrapper}>
            <ScoutOrb phase={phase} audioLevel={audioLevel} />
          </View>

          {/* Phase text */}
          <View style={styles.textContainer}>{renderPhaseText()}</View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  orbWrapper: {
    marginBottom: 40,
  },
  textContainer: {
    minHeight: 40,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  phaseText: {
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    height: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
