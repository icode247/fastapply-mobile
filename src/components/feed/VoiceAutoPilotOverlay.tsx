import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../src/hooks";
import { spacing, typography } from "../../../src/constants/theme";
import { WebView } from "react-native-webview";

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

const ORB_SIZE = 150;

// CSS Animation HTML for WebView
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

// WebView-based Voice Orb with CSS animations
const WebViewOrb: React.FC<{ onLoad?: () => void; visible?: boolean }> = ({ onLoad, visible = true }) => {
  return (
    <View style={[orbStyles.container, !visible && orbStyles.hidden]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: CSS_ANIMATION }}
        style={orbStyles.webview}
        scrollEnabled={false}
        onLoadEnd={onLoad}
      />
    </View>
  );
};

const orbStyles = StyleSheet.create({
  container: {
    width: 250,
    height: 250,
    backgroundColor: "transparent",
  },
  webview: {
    backgroundColor: "transparent",
  },
  hidden: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
  },
});

// Animated Voice Orb wrapper with touch and preloading
const AnimatedVoiceOrb: React.FC<{
  onTap: () => void;
  isVisible: boolean;
}> = ({ onTap, isVisible }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Fade in when visible and loaded
  useEffect(() => {
    if (isVisible && isLoaded) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (!isVisible) {
      fadeAnim.setValue(0);
    }
  }, [isVisible, isLoaded, fadeAnim]);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onTap} style={styles.orbTouchable}>
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
  const [phase, setPhase] = useState<"listening" | "processing" | "confirming">("listening");
  const [simulatedText, setSimulatedText] = useState("");
  const [parsedCommand, setParsedCommand] = useState<ParsedVoiceCommand | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  // Entry animation
  useEffect(() => {
    if (visible) {
      setPhase("listening");
      setSimulatedText("");
      setParsedCommand(null);
      setManualInput("");
      setShowManualInput(false);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      contentFade.setValue(0);
    }
  }, [visible, fadeAnim, slideAnim, contentFade]);

  // Parse voice command (simulated - keyword based)
  const parseCommand = useCallback((text: string): ParsedVoiceCommand => {
    const lowerText = text.toLowerCase();

    const command: ParsedVoiceCommand = {
      action: "filter",
      filters: {},
      rawText: text,
    };

    // Detect action type
    if (lowerText.includes("apply") || lowerText.includes("accept")) {
      command.action = "apply";
      command.autoSwipe = {
        direction: "right",
        count: lowerText.includes("all") ? "all" : 5,
      };
    } else if (lowerText.includes("skip") || lowerText.includes("reject") || lowerText.includes("pass")) {
      command.action = "skip";
      command.autoSwipe = {
        direction: "left",
        count: lowerText.includes("all") ? "all" : 5,
      };
    } else if (lowerText.includes("find") || lowerText.includes("show") || lowerText.includes("search")) {
      command.action = "search";
    }

    // Extract filters
    if (lowerText.includes("remote")) {
      command.filters!.remote = true;
    }

    // Job types
    const jobTypes: string[] = [];
    if (lowerText.includes("full-time") || lowerText.includes("full time")) {
      jobTypes.push("full-time");
    }
    if (lowerText.includes("part-time") || lowerText.includes("part time")) {
      jobTypes.push("part-time");
    }
    if (lowerText.includes("contract")) {
      jobTypes.push("contract");
    }
    if (lowerText.includes("intern")) {
      jobTypes.push("internship");
    }
    if (jobTypes.length > 0) {
      command.filters!.jobTypes = jobTypes;
    }

    // Locations
    const locations: string[] = [];
    const cityMatches = lowerText.match(/(?:san francisco|new york|los angeles|chicago|seattle|austin|boston|denver)/gi);
    if (cityMatches) {
      locations.push(...cityMatches.map(c => c.trim()));
    }
    if (locations.length > 0) {
      command.filters!.locations = locations;
    }

    // Salary
    const salaryMatch = lowerText.match(/(?:over|above|more than|at least)\s*\$?(\d+)k?/i);
    if (salaryMatch) {
      const salary = parseInt(salaryMatch[1]);
      command.filters!.minSalary = salary >= 1000 ? salary : salary * 1000;
    }

    // Keywords (job titles)
    const keywords: string[] = [];
    const titleMatches = lowerText.match(/(?:software|frontend|backend|full.?stack|mobile|ios|android|web|data|ml|ai)\s*(?:engineer|developer|designer)?/gi);
    if (titleMatches) {
      keywords.push(...titleMatches.map(k => k.trim()));
    }
    if (keywords.length > 0) {
      command.filters!.keywords = keywords;
    }

    return command;
  }, []);

  // Handle orb tap - simulate stopping listening
  const handleOrbTap = useCallback(() => {
    if (phase === "listening" && !showManualInput) {
      // Show manual input on tap
      setShowManualInput(true);
    }
  }, [phase, showManualInput]);

  // Handle demo command selection
  const handleDemoCommand = useCallback((command: string) => {
    setSimulatedText(command);
    setPhase("processing");

    setTimeout(() => {
      const parsed = parseCommand(command);
      setParsedCommand(parsed);
      setPhase("confirming");
    }, 1200);
  }, [parseCommand]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (parsedCommand) {
      onCommandParsed(parsedCommand);
    }
    onClose();
  }, [parsedCommand, onCommandParsed, onClose]);

  // Handle manual input submit
  const handleManualSubmit = useCallback(() => {
    if (manualInput.trim()) {
      setSimulatedText(manualInput.trim());
      setPhase("processing");

      setTimeout(() => {
        const parsed = parseCommand(manualInput.trim());
        setParsedCommand(parsed);
        setPhase("confirming");
      }, 1000);
    }
  }, [manualInput, parseCommand]);

  const renderListeningPhase = () => (
    <View style={styles.listeningContainer}>
      {/* Animated Voice Orb */}
      <AnimatedVoiceOrb onTap={handleOrbTap} isVisible={visible} />

      {/* Status text */}
      <Animated.Text
        style={[
          styles.statusText,
          { color: colors.textSecondary, opacity: contentFade },
        ]}
      >
        {phase === "processing" ? "Processing..." : "Tap the orb or try a command below"}
      </Animated.Text>

      {/* Manual input field */}
      {showManualInput && (
        <Animated.View
          style={[
            styles.manualInputContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: contentFade,
            },
          ]}
        >
          <TextInput
            style={[styles.manualInput, { color: colors.text }]}
            placeholder="Type your command..."
            placeholderTextColor={colors.textTertiary}
            value={manualInput}
            onChangeText={setManualInput}
            onSubmitEditing={handleManualSubmit}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.manualSubmitButton, { backgroundColor: colors.primary }]}
            onPress={handleManualSubmit}
          >
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Demo commands */}
      <Animated.View style={[styles.demoSection, { opacity: contentFade }]}>
        <Text style={[styles.demoTitle, { color: colors.textTertiary }]}>
          Try these commands:
        </Text>
        {DEMO_COMMANDS.map((cmd, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.demoCommand,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => handleDemoCommand(cmd)}
          >
            <Text style={[styles.demoCommandText, { color: colors.text }]}>
              "{cmd}"
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );

  const renderConfirmingPhase = () => (
    <View style={styles.confirmingContainer}>
      <View style={[styles.parsedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Heard text */}
        <Text style={[styles.parsedLabel, { color: colors.textSecondary }]}>
          I understood:
        </Text>
        <Text style={[styles.parsedText, { color: colors.text }]}>
          "{parsedCommand?.rawText}"
        </Text>

        {/* Parsed actions */}
        <View style={styles.parsedActions}>
          <Text style={[styles.parsedLabel, { color: colors.textSecondary }]}>
            Actions:
          </Text>

          {parsedCommand?.action === "filter" || parsedCommand?.action === "search" ? (
            <View style={styles.filtersList}>
              {parsedCommand.filters?.remote && (
                <View style={[styles.filterTag, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.filterTagText, { color: colors.primary }]}>Remote</Text>
                </View>
              )}
              {parsedCommand.filters?.jobTypes?.map((type, i) => (
                <View key={i} style={[styles.filterTag, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.filterTagText, { color: colors.primary }]}>{type}</Text>
                </View>
              ))}
              {parsedCommand.filters?.locations?.map((loc, i) => (
                <View key={i} style={[styles.filterTag, { backgroundColor: "#10B981" + "20" }]}>
                  <Text style={[styles.filterTagText, { color: "#10B981" }]}>{loc}</Text>
                </View>
              ))}
              {parsedCommand.filters?.minSalary && (
                <View style={[styles.filterTag, { backgroundColor: "#F59E0B" + "20" }]}>
                  <Text style={[styles.filterTagText, { color: "#F59E0B" }]}>
                    ${(parsedCommand.filters.minSalary / 1000).toFixed(0)}k+
                  </Text>
                </View>
              )}
              {parsedCommand.filters?.keywords?.map((kw, i) => (
                <View key={i} style={[styles.filterTag, { backgroundColor: "#8B5CF6" + "20" }]}>
                  <Text style={[styles.filterTagText, { color: "#8B5CF6" }]}>{kw}</Text>
                </View>
              ))}
            </View>
          ) : parsedCommand?.action === "apply" ? (
            <View style={styles.actionPreview}>
              <Ionicons name="heart" size={24} color="#00C853" />
              <Text style={[styles.actionPreviewText, { color: colors.text }]}>
                Auto-apply to {parsedCommand.autoSwipe?.count === "all" ? "all matching" : parsedCommand.autoSwipe?.count} jobs
              </Text>
            </View>
          ) : parsedCommand?.action === "skip" ? (
            <View style={styles.actionPreview}>
              <Ionicons name="close" size={24} color="#F72585" />
              <Text style={[styles.actionPreviewText, { color: colors.text }]}>
                Auto-skip {parsedCommand.autoSwipe?.count === "all" ? "all matching" : parsedCommand.autoSwipe?.count} jobs
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.confirmButtons}>
        <TouchableOpacity
          style={[styles.confirmButton, styles.cancelButton, { borderColor: colors.border }]}
          onPress={onClose}
        >
          <Text style={[styles.confirmButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmButton, styles.goButton]}
          onPress={handleConfirm}
        >
          <LinearGradient
            colors={["#0B6BCB", "#4393E4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.goButtonGradient}
          >
            <Text style={[styles.confirmButtonText, { color: "#FFFFFF" }]}>Let's Go!</Text>
            <MaterialCommunityIcons name="rocket-launch" size={20} color="#FFFFFF" />
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
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark ? "rgba(10, 10, 20, 0.98)" : "rgba(250, 250, 255, 0.98)",
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 16 }]}
          onPress={onClose}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>

        {/* Header */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              paddingTop: insets.top + 20,
              transform: [{ translateY: slideAnim }],
              opacity: contentFade,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>Voice Auto-Pilot</Text>
        </Animated.View>

        {/* Content based on phase */}
        <View style={styles.content}>
          {phase === "confirming" ? renderConfirmingPhase() : renderListeningPhase()}
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  headerContainer: {
    alignItems: "center",
    paddingHorizontal: spacing[6],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
  },
  listeningContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  orbTouchable: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  statusText: {
    fontSize: typography.fontSize.base,
    marginTop: spacing[4],
    textAlign: "center",
  },
  manualInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[6],
    borderRadius: 16,
    borderWidth: 1,
    paddingLeft: spacing[4],
    width: "100%",
  },
  manualInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing[4],
  },
  manualSubmitButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    margin: 6,
  },
  demoSection: {
    marginTop: spacing[8],
    width: "100%",
  },
  demoTitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[3],
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  demoCommand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing[2],
  },
  demoCommandText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  confirmingContainer: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 60,
  },
  parsedCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing[5],
  },
  parsedLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[1],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  parsedText: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    marginBottom: spacing[4],
    lineHeight: 26,
  },
  parsedActions: {
    marginTop: spacing[2],
  },
  filtersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  filterTag: {
    paddingVertical: spacing[1] + 2,
    paddingHorizontal: spacing[3],
    borderRadius: 20,
  },
  filterTagText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
  },
  actionPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[2],
    gap: spacing[2],
  },
  actionPreviewText: {
    fontSize: typography.fontSize.base,
    fontWeight: "500",
  },
  confirmButtons: {
    flexDirection: "row",
    marginTop: spacing[6],
    gap: spacing[3],
  },
  confirmButton: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  cancelButton: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
  },
  goButton: {},
  goButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: "700",
  },
});
