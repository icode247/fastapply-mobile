import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Simulated voice commands for demo
const DEMO_COMMANDS = [
  "Find me remote software engineer jobs",
  "Show full-time positions in San Francisco",
  "Apply to all jobs paying over $100k",
  "Skip contract positions",
  "Find hybrid roles in New York",
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

// Voice visualization bars component
const VoiceWaveform: React.FC<{ isListening: boolean; intensity: number }> = ({
  isListening,
  intensity,
}) => {
  const { colors } = useTheme();
  const barCount = 5;
  const barAnimations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (isListening) {
      // Animate bars with random heights based on intensity
      const animateBar = (index: number) => {
        const baseHeight = 0.3;
        const maxHeight = Math.min(1, baseHeight + intensity * 0.7);
        const randomHeight = baseHeight + Math.random() * (maxHeight - baseHeight);

        Animated.sequence([
          Animated.timing(barAnimations[index], {
            toValue: randomHeight,
            duration: 100 + Math.random() * 100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(barAnimations[index], {
            toValue: baseHeight + Math.random() * 0.2,
            duration: 100 + Math.random() * 100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]).start(() => {
          if (isListening) {
            animateBar(index);
          }
        });
      };

      barAnimations.forEach((_, index) => {
        setTimeout(() => animateBar(index), index * 50);
      });
    } else {
      // Reset bars
      barAnimations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [isListening, intensity, barAnimations]);

  return (
    <View style={styles.waveformContainer}>
      {barAnimations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveformBar,
            {
              backgroundColor: colors.primary,
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 80],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

// Pulsing ring animation
const PulsingRings: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const { colors } = useTheme();
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      const animateRing = (ring: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(ring, {
              toValue: 1,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(ring, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      animateRing(ring1, 0);
      animateRing(ring2, 666);
      animateRing(ring3, 1333);
    } else {
      ring1.setValue(0);
      ring2.setValue(0);
      ring3.setValue(0);
    }
  }, [isActive, ring1, ring2, ring3]);

  const renderRing = (ring: Animated.Value) => (
    <Animated.View
      style={[
        styles.pulsingRing,
        {
          borderColor: colors.primary,
          opacity: ring.interpolate({
            inputRange: [0, 1],
            outputRange: [0.6, 0],
          }),
          transform: [
            {
              scale: ring.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2.5],
              }),
            },
          ],
        },
      ]}
    />
  );

  return (
    <View style={styles.ringsContainer}>
      {renderRing(ring1)}
      {renderRing(ring2)}
      {renderRing(ring3)}
    </View>
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
  const [voiceIntensity, setVoiceIntensity] = useState(0);
  const [parsedCommand, setParsedCommand] = useState<ParsedVoiceCommand | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const micScale = useRef(new Animated.Value(1)).current;

  // Simulate voice intensity changes
  useEffect(() => {
    if (visible && phase === "listening") {
      const interval = setInterval(() => {
        setVoiceIntensity(Math.random());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [visible, phase]);

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
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Mic pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(micScale, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(micScale, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible, fadeAnim, slideAnim, micScale]);

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
    const locationPatterns = [
      /in\s+([\w\s]+?)(?:\s+paying|\s+over|\s+under|$)/i,
      /(?:san francisco|new york|los angeles|chicago|seattle|austin|boston|denver)/gi,
    ];

    const cityMatches = lowerText.match(locationPatterns[1]);
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
    const titlePatterns = [
      /(?:software|frontend|backend|full.?stack|mobile|ios|android|web|data|ml|ai)\s*(?:engineer|developer|designer)?/gi,
      /(?:product|project|program)\s*manager/gi,
      /(?:ui|ux|product)\s*designer/gi,
    ];

    const keywords: string[] = [];
    titlePatterns.forEach(pattern => {
      const matches = lowerText.match(pattern);
      if (matches) {
        keywords.push(...matches.map(k => k.trim()));
      }
    });
    if (keywords.length > 0) {
      command.filters!.keywords = keywords;
    }

    return command;
  }, []);

  // Handle simulated voice input completion
  const handleSimulatedComplete = useCallback(() => {
    setPhase("processing");

    // Simulate processing delay
    setTimeout(() => {
      const command = parseCommand(simulatedText || manualInput);
      setParsedCommand(command);
      setPhase("confirming");
    }, 1000);
  }, [simulatedText, manualInput, parseCommand]);

  // Handle demo command selection
  const handleDemoCommand = useCallback((command: string) => {
    setSimulatedText(command);
    setPhase("processing");

    setTimeout(() => {
      const parsed = parseCommand(command);
      setParsedCommand(parsed);
      setPhase("confirming");
    }, 800);
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
      handleSimulatedComplete();
    }
  }, [manualInput, handleSimulatedComplete]);

  const renderListeningPhase = () => (
    <View style={styles.listeningContainer}>
      {/* Pulsing rings behind mic */}
      <PulsingRings isActive={phase === "listening"} />

      {/* Main mic button */}
      <Animated.View
        style={[
          styles.micButton,
          {
            backgroundColor: colors.primary,
            transform: [{ scale: micScale }],
          },
        ]}
      >
        <MaterialCommunityIcons name="microphone" size={48} color="#FFFFFF" />
      </Animated.View>

      {/* Voice waveform */}
      <VoiceWaveform isListening={phase === "listening"} intensity={voiceIntensity} />

      {/* Listening text */}
      <Text style={[styles.listeningText, { color: colors.text }]}>
        {phase === "listening" ? "Listening..." : "Processing..."}
      </Text>

      {/* Manual input toggle */}
      <TouchableOpacity
        style={[styles.manualInputToggle, { borderColor: colors.border }]}
        onPress={() => setShowManualInput(!showManualInput)}
      >
        <Ionicons name="keyboard-outline" size={20} color={colors.textSecondary} />
        <Text style={[styles.manualInputToggleText, { color: colors.textSecondary }]}>
          Type instead
        </Text>
      </TouchableOpacity>

      {/* Manual input field */}
      {showManualInput && (
        <View style={[styles.manualInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
        </View>
      )}

      {/* Demo commands */}
      <View style={styles.demoSection}>
        <Text style={[styles.demoTitle, { color: colors.textSecondary }]}>
          Try saying:
        </Text>
        <View style={styles.demoCommands}>
          {DEMO_COMMANDS.slice(0, 3).map((cmd, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.demoCommand, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleDemoCommand(cmd)}
            >
              <Text style={[styles.demoCommandText, { color: colors.text }]} numberOfLines={1}>
                "{cmd}"
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderConfirmingPhase = () => (
    <View style={styles.confirmingContainer}>
      <View style={[styles.parsedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Heard text */}
        <Text style={[styles.parsedLabel, { color: colors.textSecondary }]}>
          I heard:
        </Text>
        <Text style={[styles.parsedText, { color: colors.text }]}>
          "{parsedCommand?.rawText}"
        </Text>

        {/* Parsed actions */}
        <View style={styles.parsedActions}>
          <Text style={[styles.parsedLabel, { color: colors.textSecondary }]}>
            I'll do this:
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
          style={[styles.confirmButton, styles.goButton, { backgroundColor: colors.primary }]}
          onPress={handleConfirm}
        >
          <Text style={[styles.confirmButtonText, { color: "#FFFFFF" }]}>Let's Go!</Text>
          <MaterialCommunityIcons name="rocket-launch" size={20} color="#FFFFFF" />
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
            backgroundColor: isDark ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.98)",
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

        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              paddingTop: insets.top + 60,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <MaterialCommunityIcons name="robot-happy" size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Voice Auto-Pilot</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tell me what jobs you're looking for
          </Text>
        </Animated.View>

        {/* Content based on phase */}
        <Animated.View
          style={[
            styles.content,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {phase === "confirming" ? renderConfirmingPhase() : renderListeningPhase()}
        </Animated.View>
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
  titleContainer: {
    alignItems: "center",
    paddingHorizontal: spacing[6],
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "800",
    marginTop: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    marginTop: spacing[1],
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
  },
  listeningContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -60,
  },
  ringsContainer: {
    position: "absolute",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  pulsingRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 100,
    marginTop: spacing[6],
    gap: 8,
  },
  waveformBar: {
    width: 6,
    borderRadius: 3,
  },
  listeningText: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    marginTop: spacing[4],
  },
  manualInputToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[6],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  manualInputToggleText: {
    fontSize: typography.fontSize.sm,
  },
  manualInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing[4],
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: spacing[4],
    width: "100%",
  },
  manualInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing[3],
  },
  manualSubmitButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  demoSection: {
    marginTop: spacing[8],
    width: "100%",
  },
  demoTitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[3],
    textAlign: "center",
  },
  demoCommands: {
    gap: spacing[2],
  },
  demoCommand: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 12,
    borderWidth: 1,
  },
  demoCommandText: {
    fontSize: typography.fontSize.sm,
    fontStyle: "italic",
  },
  confirmingContainer: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 100,
  },
  parsedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing[5],
  },
  parsedLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[1],
  },
  parsedText: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    fontStyle: "italic",
    marginBottom: spacing[4],
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    borderRadius: 12,
    gap: spacing[2],
  },
  cancelButton: {
    borderWidth: 1,
  },
  goButton: {},
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: "700",
  },
});
