import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";

interface NotificationPermissionModalProps {
  visible: boolean;
  onEnable: () => void;
  onSkip: () => void;
}

export const NotificationPermissionModal: React.FC<
  NotificationPermissionModalProps
> = ({ visible, onEnable, onSkip }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Animations
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const notificationAnim = useRef(new Animated.Value(0)).current;
  const feature1Anim = useRef(new Animated.Value(0)).current;
  const feature2Anim = useRef(new Animated.Value(0)).current;
  const feature3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      slideAnim.setValue(300);
      backdropAnim.setValue(0);
      notificationAnim.setValue(0);
      feature1Anim.setValue(0);
      feature2Anim.setValue(0);
      feature3Anim.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();

      // Notification card slide in
      Animated.spring(notificationAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: 200,
        useNativeDriver: true,
      }).start();

      // Staggered feature animations
      Animated.stagger(100, [
        Animated.spring(feature1Anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(feature2Anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(feature3Anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSkip();
    });
  };

  const features = [
    {
      icon: "notifications-outline" as const,
      text: "Stay informed about application statuses",
      anim: feature1Anim,
    },
    {
      icon: "briefcase-outline" as const,
      text: "Receive job recommendations that fit your profile",
      anim: feature2Anim,
    },
    {
      icon: "checkmark-circle-outline" as const,
      text: "Get alerted if an application needs more info",
      anim: feature3Anim,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="none">
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropAnim,
            backgroundColor: isDark
              ? "rgba(0,0,0,0.7)"
              : "rgba(0,0,0,0.4)",
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + spacing[4],
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Close button */}
        <TouchableOpacity
          style={[
            styles.closeButton,
            { backgroundColor: colors.surfaceSecondary },
          ]}
          onPress={handleClose}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>Stay updated</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Get notified about important updates on your applications
        </Text>

        {/* Mock notification */}
        <Animated.View
          style={[
            styles.notificationCard,
            {
              opacity: notificationAnim,
              transform: [
                {
                  translateY: notificationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
                {
                  scale: notificationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={
              isDark
                ? ["#1a1a2e", "#16213e", "#0f3460"]
                : ["#667eea", "#764ba2", "#f093fb"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.notificationGradient}
          >
            <View style={styles.notificationContent}>
              <View
                style={[
                  styles.appIcon,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text style={[styles.appIconText, { color: colors.primary }]}>
                  FA
                </Text>
              </View>
              <View style={styles.notificationText}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationAppName}>FastApply</Text>
                  <Text style={styles.notificationTime}>now</Text>
                </View>
                <Text style={styles.notificationTitle}>Application Update</Text>
                <Text style={styles.notificationBody} numberOfLines={1}>
                  Google has viewed your application for...
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <Animated.View
              key={feature.text}
              style={[
                styles.featureRow,
                {
                  opacity: feature.anim,
                  transform: [
                    {
                      translateX: feature.anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons
                  name={feature.icon}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text
                style={[styles.featureText, { color: colors.textSecondary }]}
              >
                {feature.text}
              </Text>
            </Animated.View>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleClose}>
            <Text
              style={[styles.skipButtonText, { color: colors.textSecondary }]}
            >
              Not now
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.enableButton, { backgroundColor: colors.primary }]}
            onPress={onEnable}
            activeOpacity={0.85}
          >
            <Text style={styles.enableButtonText}>Enable notifications</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: borderRadius["2xl"],
    borderTopRightRadius: borderRadius["2xl"],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[5],
  },
  closeButton: {
    position: "absolute",
    top: spacing[4],
    right: spacing[4],
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "700",
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    marginBottom: spacing[5],
  },
  notificationCard: {
    marginBottom: spacing[6],
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  notificationGradient: {
    padding: spacing[4],
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[3],
  },
  appIconText: {
    fontSize: 14,
    fontWeight: "800",
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  notificationAppName: {
    color: "#FFFFFF",
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
  },
  notificationTime: {
    color: "rgba(255,255,255,0.7)",
    fontSize: typography.fontSize.xs,
  },
  notificationTitle: {
    color: "#FFFFFF",
    fontSize: typography.fontSize.base,
    fontWeight: "700",
    marginBottom: 2,
  },
  notificationBody: {
    color: "rgba(255,255,255,0.8)",
    fontSize: typography.fontSize.sm,
  },
  featuresContainer: {
    marginBottom: spacing[6],
    gap: spacing[4],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    lineHeight: 22,
  },
  buttonsContainer: {
    gap: spacing[2],
  },
  skipButton: {
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  enableButton: {
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    alignItems: "center",
  },
  enableButtonText: {
    color: "#FFFFFF",
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
  },
});

export default NotificationPermissionModal;
