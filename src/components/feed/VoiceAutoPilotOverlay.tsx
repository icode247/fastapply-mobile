import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
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

// Simulated voice commands for demo
const DEMO_COMMANDS = [
  "Find me remote software engineer jobs",
  "Show full-time positions in San Francisco",
  "Apply to all jobs paying over $100k",
];

export interface ParsedVoiceCommand {
  action: "filter" | "apply" | "skip" | "search";
  filters?: {
    remote?: boolean;
    jobTypes?: string[];
    locations?: string[];
    minSalary?: number;
    keywords?: string[];
  };
  autoSwipe?: {
    direction: "left" | "right";
    count: number | "all";
    condition?: string;
  };
  rawText: string;
}

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

        .inner-core {
            position: absolute;
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
        <div class="inner-core"></div>
    </div>
</body>
</html>
`;

// WebView-based Voice Orb
const WebViewOrb: React.FC<{ onLoad?: () => void; visible?: boolean }> = ({
  onLoad,
  visible = true,
}) => {
  return (
    <View style={[orbStyles.container, !visible && orbStyles.hidden]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: CSS_ANIMATION }}
        style={orbStyles.webview}
        scrollEnabled={false}
        onLoadEnd={onLoad}
        androidLayerType="hardware"
      />
    </View>
  );
};

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
}> = ({ onTap, isVisible }) => {
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
        <WebViewOrb onLoad={handleLoad} visible={isVisible} />
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
  const [parsedCommand, setParsedCommand] = useState<ParsedVoiceCommand | null>(
    null,
  );
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Entry animation
  useEffect(() => {
    if (visible) {
      setPhase("listening");
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
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible, fadeAnim, slideAnim]);

  // Command Parser Mock
  const parseCommand = useCallback((text: string): ParsedVoiceCommand => {
    const lowerText = text.toLowerCase();
    const command: ParsedVoiceCommand = {
      action: "filter",
      filters: {},
      rawText: text,
    };

    if (lowerText.includes("apply") || lowerText.includes("accept")) {
      command.action = "apply";
      command.autoSwipe = {
        direction: "right",
        count: lowerText.includes("all") ? "all" : 5,
      };
    } else if (
      lowerText.includes("skip") ||
      lowerText.includes("reject") ||
      lowerText.includes("pass")
    ) {
      command.action = "skip";
      command.autoSwipe = {
        direction: "left",
        count: lowerText.includes("all") ? "all" : 5,
      };
    } else if (
      lowerText.includes("find") ||
      lowerText.includes("show") ||
      lowerText.includes("search")
    ) {
      command.action = "search";
    }

    if (lowerText.includes("remote")) command.filters!.remote = true;

    // ... (rest of parser logic same as before but condensed for brevity)
    if (lowerText.match(/(\d+)k/)) {
      const match = lowerText.match(/(\d+)k/);
      if (match) command.filters!.minSalary = parseInt(match[1]) * 1000;
    }

    const locs = ["San Francisco", "New York", "London", "Remote"];
    const foundLocs = locs.filter((l) => lowerText.includes(l.toLowerCase()));
    if (foundLocs.length) command.filters!.locations = foundLocs;

    return command;
  }, []);

  const handleOrbTap = useCallback(() => {
    if (phase === "listening" && !showManualInput) {
      setShowManualInput(true);
    }
  }, [phase, showManualInput]);

  const processCommand = useCallback(
    (text: string) => {
      setPhase("processing");
      setTimeout(() => {
        const parsed = parseCommand(text);
        setParsedCommand(parsed);
        setPhase("confirming");
      }, 1000);
    },
    [parseCommand],
  );

  const renderListening = () => (
    <View style={styles.centerContent}>
      <AnimatedVoiceOrb onTap={handleOrbTap} isVisible={visible} />

      <Text style={[styles.statusTitle, { color: colors.text }]}>
        {phase === "processing" ? "Thinking..." : "Listening..."}
      </Text>
      <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
        {phase === "processing"
          ? "Analyzing your request"
          : "Tap orb to type manually"}
      </Text>

      {!showManualInput && phase === "listening" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsContent}
        >
          {DEMO_COMMANDS.map((cmd, i) => (
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
              onPress={() => processCommand(cmd)}
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
            onSubmitEditing={() => processCommand(manualInput)}
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
          {parsedCommand?.action === "apply" && (
            <Ionicons name="heart" size={24} color="#00C853" />
          )}
          {parsedCommand?.action === "skip" && (
            <Ionicons name="close" size={24} color="#F72585" />
          )}
          {parsedCommand?.action === "filter" && (
            <Ionicons name="filter" size={24} color={colors.primary} />
          )}
          <Text style={[styles.actionText, { color: colors.text }]}>
            {parsedCommand?.action === "apply"
              ? "Auto-apply to matching jobs"
              : parsedCommand?.action === "skip"
                ? "Auto-skip matching jobs"
                : "Filter feed"}
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
      <View style={styles.container}>
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
      </View>
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
