// VoiceCommandOverlay - Fullscreen overlay for voice command interaction

import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../ui/Text";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { useTheme } from "../../hooks";
import { spacing, typography } from "../../constants/theme";
import { VoiceActivityIcon } from "./VoiceActivityIcon";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface VoiceCommandOverlayProps {
  visible: boolean;
  isListening: boolean;
  isProcessing: boolean;
  suggestion?: string;
  onClose: () => void;
  onStopListening: () => void;
}

// Animated pulsing ring component
const PulsingRing = ({ delay, color }: { delay: number; color: string }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scale.value = withRepeat(
        withSequence(
          withTiming(2.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 })
        ),
        -1
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
          withTiming(0.6, { duration: 0 })
        ),
        -1
      );
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.pulsingRing,
        { borderColor: color },
        animatedStyle,
      ]}
    />
  );
};

// Animated waveform bar
const WaveformBar = ({
  index,
  isActive,
  color,
}: {
  index: number;
  isActive: boolean;
  color: string;
}) => {
  const height = useSharedValue(20);

  useEffect(() => {
    if (isActive) {
      height.value = withRepeat(
        withSequence(
          withTiming(30 + Math.random() * 40, {
            duration: 100 + Math.random() * 100,
            easing: Easing.ease,
          }),
          withTiming(15 + Math.random() * 20, {
            duration: 100 + Math.random() * 100,
            easing: Easing.ease,
          })
        ),
        -1,
        true
      );
    } else {
      height.value = withTiming(20, { duration: 300 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.waveformBar,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
};

export const VoiceCommandOverlay: React.FC<VoiceCommandOverlayProps> = ({
  visible,
  isListening,
  isProcessing,
  suggestion,
  onClose,
  onStopListening,
}) => {
  const { colors, isDark } = useTheme();

  // Animation for main button
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    if (isListening) {
      buttonScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      buttonScale.value = withSpring(1);
    }
  }, [isListening]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const statusText = isProcessing
    ? "Processing..."
    : isListening
    ? "Listening..."
    : "Tap to speak";

  const hintText = isListening
    ? 'Try: "Search for frontend jobs in USA"'
    : isProcessing
    ? "Understanding your command..."
    : suggestion || 'Say "Help" for available commands';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView
        intensity={isDark ? 80 : 60}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.container,
          Platform.OS === "android" && {
            backgroundColor: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.92)",
          },
        ]}
      >
        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.surface }]}
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Main content */}
        <View style={styles.content}>
          {/* Status text */}
          <Text style={[styles.statusText, { color: colors.text }]}>
            {statusText}
          </Text>

          {/* Voice button with animations */}
          <View style={styles.voiceButtonContainer}>
            {/* Pulsing rings (only when listening) */}
            {isListening && (
              <>
                <PulsingRing delay={0} color={colors.primary} />
                <PulsingRing delay={500} color={colors.primary} />
                <PulsingRing delay={1000} color={colors.primary} />
              </>
            )}

            {/* Main button */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  {
                    backgroundColor: isListening
                      ? colors.primary
                      : colors.surface,
                    borderColor: isListening
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={isListening ? onStopListening : undefined}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <Ionicons
                    name="hourglass-outline"
                    size={48}
                    color={colors.text}
                  />
                ) : isListening ? (
                  <VoiceActivityIcon color="#FFFFFF" barCount={5} />
                ) : (
                  <Ionicons name="mic" size={48} color={colors.primary} />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Waveform visualization */}
          {isListening && (
            <View style={styles.waveformContainer}>
              {Array.from({ length: 12 }).map((_, i) => (
                <WaveformBar
                  key={i}
                  index={i}
                  isActive={isListening}
                  color={colors.primary}
                />
              ))}
            </View>
          )}

          {/* Hint text */}
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            {hintText}
          </Text>

          {/* Suggestion text (after processing) */}
          {suggestion && !isListening && !isProcessing && (
            <View
              style={[
                styles.suggestionContainer,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.suggestionText, { color: colors.text }]}>
                {suggestion}
              </Text>
            </View>
          )}
        </View>

        {/* Example commands */}
        <View style={styles.examplesContainer}>
          <Text style={[styles.examplesTitle, { color: colors.textSecondary }]}>
            Example commands:
          </Text>
          <View style={styles.examplesList}>
            {[
              '"Apply to this job"',
              '"Search for React jobs in NYC"',
              '"Show me remote positions"',
              '"Apply to all matching jobs"',
            ].map((example, index) => (
              <View
                key={index}
                style={[
                  styles.exampleChip,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Text
                  style={[styles.exampleText, { color: colors.textSecondary }]}
                >
                  {example}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </BlurView>
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
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: spacing[6],
  },
  statusText: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "600",
    marginBottom: spacing[8],
  },
  voiceButtonContainer: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  pulsingRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  voiceButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 80,
    marginTop: spacing[6],
    gap: 4,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
  },
  hintText: {
    fontSize: typography.fontSize.base,
    textAlign: "center",
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
  },
  suggestionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 12,
    gap: spacing[2],
  },
  suggestionText: {
    fontSize: typography.fontSize.base,
    flex: 1,
  },
  examplesContainer: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[6],
  },
  examplesTitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[2],
    textAlign: "center",
  },
  examplesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing[2],
  },
  exampleChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 16,
  },
  exampleText: {
    fontSize: typography.fontSize.xs,
  },
});

export default VoiceCommandOverlay;
