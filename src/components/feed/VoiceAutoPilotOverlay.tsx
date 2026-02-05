import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useTheme } from "../../../src/hooks";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

import {
  speechToTextService,
  voiceCommandParserService,
  voiceRecordingService,
} from "../../../src/services/voice";
import { ParsedVoiceCommand } from "../../../src/types/voice.types";

// Example suggestions
const SUGGESTIONS = [
  "Find me remote software engineer jobs",
  "Show full-time positions in San Francisco",
  "Apply to all jobs paying over $100k",
];

interface VoiceAutoPilotOverlayProps {
  visible: boolean;
  onClose: () => void;
  onCommandParsed: (command: ParsedVoiceCommand) => void;
}

// CSS Animation HTML for WebView - The "Liquid Orb"
const CSS_ANIMATION = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: transparent;
            margin: 0;
            overflow: hidden;
        }

        .voice-orb {
            position: relative;
            width: 180px;
            height: 180px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .orb-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: transform 0.1s ease-out;
        }

        .inner-core {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #ffffff 0%, #c2e9fb 25%, #00c6ff 50%, #0072ff 75%, #ffffff 100%);
            background-size: 300% 300%;
            border-radius: 46% 54% 45% 55% / 55% 46% 54% 45%;
            animation: wobble 10s ease-in-out infinite, paint-flow 5s ease infinite alternate;
            box-shadow: 0 0 30px rgba(0, 198, 255, 0.4);
        }

        @keyframes paint-flow {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }

        @keyframes wobble {
            0% { transform: rotate(0deg); border-radius: 45% 55% 40% 60% / 55% 45% 60% 40%; }
            33% { border-radius: 55% 45% 60% 40% / 45% 55% 40% 60%; }
            66% { border-radius: 40% 60% 55% 45% / 60% 40% 45% 55%; }
            100% { transform: rotate(360deg); border-radius: 45% 55% 40% 60% / 55% 45% 60% 40%; }
        }
    </style>
</head>
<body>
    <div class="voice-orb">
        <div class="orb-wrapper">
            <div class="inner-core"></div>
        </div>
    </div>
</body>
</html>
`;

// WebView-based Voice Orb
const WebViewOrb = React.forwardRef<
  WebView,
  { onLoad?: () => void; visible?: boolean }
>(({ onLoad, visible = true }, ref) => {
  return (
    <View style={[orbStyles.container, !visible && orbStyles.hidden]}>
      <WebView
        ref={ref}
        originWhitelist={["*"]}
        source={{ html: CSS_ANIMATION }}
        style={orbStyles.webview}
        scrollEnabled={false}
        onLoadEnd={onLoad}
        androidLayerType="hardware"
      />
    </View>
  );
});

const orbStyles = StyleSheet.create({
  container: {
    width: 260,
    height: 260,
    backgroundColor: "transparent",
  },
  webview: {
    backgroundColor: "transparent",
  },
  hidden: {
    opacity: 0,
    pointerEvents: "none",
  },
});

// Wrapper with Fade In
const AnimatedVoiceOrb: React.FC<{
  onTap: () => void;
  isVisible: boolean;
  webViewRef: React.RefObject<WebView | null>;
}> = ({ onTap, isVisible, webViewRef }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isVisible && isLoaded) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (!isVisible) {
      fadeAnim.setValue(0);
    }
  }, [isVisible, isLoaded, fadeAnim]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onTap}
      style={styles.orbTouchable}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <WebViewOrb ref={webViewRef} onLoad={handleLoad} visible={isVisible} />
      </Animated.View>
    </TouchableOpacity>
  );
};

export const VoiceAutoPilotOverlay: React.FC<VoiceAutoPilotOverlayProps> = ({
  visible,
  onClose,
  onCommandParsed,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // States
  const [phase, setPhase] = useState<"listening" | "processing" | "confirming">(
    "listening",
  );
  const [isRecording, setIsRecording] = useState(false);
  const [parsedCommand, setParsedCommand] = useState<ParsedVoiceCommand | null>(
    null,
  );
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const webViewRef = useRef<WebView>(null);

  // Entry animation and Auto-Start
  useEffect(() => {
    let timeoutId: any;

    if (visible) {
      setPhase("listening");
      setIsRecording(false);
      setParsedCommand(null);
      setManualInput("");
      setShowManualInput(false);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-start recording after a short delay to allow animation to settle
      timeoutId = setTimeout(() => {
        startRecordingSession();
      }, 500);
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      // Ensure recording is stopped if closed
      voiceRecordingService.cancelRecording();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [visible, fadeAnim, slideAnim]);

  // Handle AppState changes (Stop recording if backgrounded)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/) && visible) {
        // If app goes to background, cancel recording immediately
        voiceRecordingService.cancelRecording();
        onClose();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [visible, onClose]);

  // Permissions check on mount
  useEffect(() => {
    voiceRecordingService.requestPermissions();
  }, []);

  const stopAndProcess = useCallback(async () => {
    setPhase("processing");
    setIsRecording(false);
    console.log("VoiceAutoPilotOverlay: Starting processing (v2)");
    try {
      const result = await voiceRecordingService.stopRecording();

      // If no voice was detected at all (silent recording), just close
      if (result.isSilent) {
        console.log("Empty recording detected - cancelling");
        setPhase("listening"); // Reset phase just in case
        onClose();
        return;
      }

      if (result.success && result.uri) {
        // Transcribe
        const transcription = await speechToTextService.transcribeJobCommand(
          result.uri,
        );

        if (!transcription.text) {
          Alert.alert("Sorry", "I didn't catch that. Please try again.");
          setPhase("listening");
          return;
        }

        // Parse Intent
        const command = await voiceCommandParserService.parseCommand(
          transcription.text,
        );
        setParsedCommand(command);
        setPhase("confirming");
      } else {
        Alert.alert("Error", "Failed to capture audio.");
        setPhase("listening");
      }
    } catch (error) {
      console.error("Processing error:", error);
      Alert.alert("Error", "Failed to process voice command.");
      setPhase("listening");
    }
  }, []);

  const startRecordingSession = useCallback(async () => {
    // Haptic feedback FIRST - fires immediately, no waiting
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Play start sound (async, don't block)
    Audio.Sound.createAsync(require("../../../assets/sounds/listen_on.mp3"))
      .then(({ sound }) => sound.playAsync())
      .catch(() => {});

    const started = await voiceRecordingService.startRecording({
      onSilenceDetected: () => {
        stopAndProcess();
      },
      silenceThresholdMs: 5000, // 5 seconds of silence stops recording
    });
    if (started) {
      setPhase("listening");
      setIsRecording(true);
    } else {
      Alert.alert(
        "Permission Required",
        "Please enable microphone permissions in settings to use voice commands.",
      );
    }
  }, [stopAndProcess]);

  const handleOrbTap = useCallback(async () => {
    // If showing manual input, close it
    if (showManualInput) {
      setShowManualInput(false);
      return;
    }

    // Toggle recording
    const status = voiceRecordingService.getStatus();
    if (status.isRecording) {
      await stopAndProcess();
    } else {
      await startRecordingSession();
    }
  }, [showManualInput, stopAndProcess, startRecordingSession]);

  // Handle manual text input
  const processManualInput = useCallback(async (text: string) => {
    setPhase("processing");
    try {
      const command = await voiceCommandParserService.parseCommand(text);
      setParsedCommand(command);
      setPhase("confirming");
    } catch (e) {
      setPhase("listening");
    }
  }, []);

  const renderListening = () => (
    <View style={styles.centerContent}>
      <AnimatedVoiceOrb
        onTap={handleOrbTap}
        isVisible={visible}
        webViewRef={webViewRef}
      />

      <Text style={[styles.statusTitle, { color: colors.text }]}>
        {phase === "processing"
          ? "Thinking..."
          : isRecording
            ? "Listening..."
            : "Tap to Speak"}
      </Text>
      <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
        {phase === "processing"
          ? "Analyzing your request"
          : isRecording
            ? "Tap again to finish"
            : "Or type manually"}
      </Text>

      {!showManualInput && phase === "listening" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsContent}
        >
          {SUGGESTIONS.map((cmd, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.suggestionChip,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                },
              ]}
              onPress={() => processManualInput(cmd)}
            >
              <Text style={{ color: colors.textSecondary }}>"{cmd}"</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {showManualInput && (
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              },
            ]}
            placeholder="Type your command..."
            placeholderTextColor={colors.textTertiary}
            value={manualInput}
            onChangeText={setManualInput}
            onSubmitEditing={() => processManualInput(manualInput)}
            autoFocus
          />
        </View>
      )}
    </View>
  );

  const renderConfirming = () => (
    <View style={styles.centerContent}>
      <View
        style={[
          styles.resultCard,
          {
            backgroundColor: isDark
              ? "rgba(30,30,40,0.8)"
              : "rgba(255,255,255,0.9)",
          },
        ]}
      >
        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
          I HEARD
        </Text>
        <Text style={[styles.resultText, { color: colors.text }]}>
          "{parsedCommand?.rawText}"
        </Text>

        <View style={styles.divider} />

        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
          ACTION
        </Text>
        <View style={styles.actionRow}>
          {parsedCommand?.intent === "apply" && (
            <Ionicons name="heart" size={24} color="#00C853" />
          )}
          {parsedCommand?.intent === "skip" && (
            <Ionicons name="close" size={24} color="#F72585" />
          )}
          {parsedCommand?.intent === "filter" && (
            <Ionicons name="filter" size={24} color={colors.primary} />
          )}
          <Text style={[styles.actionText, { color: colors.text }]}>
            {parsedCommand?.intent === "apply"
              ? "Auto-apply to matching jobs"
              : parsedCommand?.intent === "skip"
                ? "Auto-skip matching jobs"
                : parsedCommand?.suggestion || "Update filters"}
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.cancelBtn]}
          onPress={() => setPhase("listening")}
        >
          <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.confirmBtn]}
          onPress={() => {
            if (parsedCommand) onCommandParsed(parsedCommand);
            onClose();
          }}
        >
          <LinearGradient
            colors={["#007AFF", "#00C6FF"]}
            style={styles.gradientBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.btnText, { color: "#FFF" }]}>Execute</Text>
            <MaterialCommunityIcons
              name="rocket-launch"
              size={18}
              color="#FFF"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Glass Background */}
        <BlurView
          intensity={Platform.OS === "ios" ? 40 : 100}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 16 }]}
          onPress={onClose}
        >
          <Ionicons name="close-circle" size={36} color={colors.textTertiary} />
        </TouchableOpacity>

        {/* Main Content */}
        <Animated.View
          style={[
            styles.contentContainer,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
          ]}
        >
          {phase === "confirming" ? renderConfirming() : renderListening()}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end", // Bottom sheet feel
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
  centerContent: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  closeBtn: {
    position: "absolute",
    right: 20,
    zIndex: 20,
  },
  orbTouchable: {
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  suggestionsScroll: {
    maxHeight: 50,
    width: "100%",
  },
  suggestionsContent: {
    paddingHorizontal: 10,
    alignItems: "center",
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(150,150,150,0.1)",
  },
  inputWrapper: {
    width: "100%",
    marginTop: 10,
  },
  input: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
  },
  // Results
  resultCard: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 30,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    opacity: 0.7,
  },
  resultText: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    lineHeight: 28,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(150,150,150,0.1)",
    marginVertical: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    fontSize: 18,
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "rgba(150,150,150,0.1)",
  },
  confirmBtn: {
    overflow: "hidden",
  },
  gradientBtn: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
