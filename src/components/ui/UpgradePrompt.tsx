import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "./Text";
import {
  getPlanDisplayName,
  isUnlimited,
} from "../../constants/subscription-limits";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  currentTier: string;
  limitType: "profiles" | "resumes" | "applications";
  currentCount: number;
  limit: number;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  onClose,
  title = "Upgrade Required",
  message,
  currentTier,
  limitType,
  currentCount,
  limit,
}) => {
  const router = useRouter();
  const { colors } = useTheme();

  const handleUpgrade = () => {
    onClose();
    // Navigate to subscription/pricing screen - for now just close
    // router.push("/subscription"); // TODO: create subscription screen
  };

  const getLimitLabel = () => {
    if (isUnlimited(limit)) return "Unlimited";
    return limit.toString();
  };

  const getIcon = () => {
    switch (limitType) {
      case "profiles":
        return "person-circle-outline";
      case "resumes":
        return "document-text-outline";
      case "applications":
        return "briefcase-outline";
      default:
        return "lock-closed-outline";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.container,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name={getIcon()} size={32} color={colors.primary} />
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          {/* Current Usage */}
          <View
            style={[styles.usageContainer, { backgroundColor: colors.level1 }]}
          >
            <View style={styles.usageItem}>
              <Text
                style={[styles.usageLabel, { color: colors.textSecondary }]}
              >
                Current Plan
              </Text>
              <Text style={[styles.usageValue, { color: colors.text }]}>
                {getPlanDisplayName(currentTier)}
              </Text>
            </View>
            <View
              style={[styles.usageDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.usageItem}>
              <Text
                style={[styles.usageLabel, { color: colors.textSecondary }]}
              >
                Used
              </Text>
              <Text style={[styles.usageValue, { color: colors.text }]}>
                {currentCount} / {getLimitLabel()}
              </Text>
            </View>
          </View>

          {/* Upgrade Benefits */}
          <View style={styles.benefitsContainer}>
            <Text
              style={[styles.benefitsTitle, { color: colors.textSecondary }]}
            >
              Upgrade to unlock:
            </Text>
            <View style={styles.benefitRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.success}
              />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                More {limitType}
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.success}
              />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                AI-tailored resumes
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.success}
              />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Priority support
              </Text>
            </View>
          </View>

          {/* CTA Buttons */}
          <TouchableOpacity onPress={handleUpgrade} activeOpacity={0.9}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeButton}
            >
              <Ionicons name="rocket-outline" size={20} color="white" />
              <Text style={styles.upgradeButtonText}>View Upgrade Options</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterButton} onPress={onClose}>
            <Text
              style={[styles.laterButtonText, { color: colors.textSecondary }]}
            >
              Maybe Later
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
  },
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[4],
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    padding: spacing[1],
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    marginBottom: spacing[2],
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    marginBottom: spacing[5],
  },
  usageContainer: {
    flexDirection: "row",
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  usageItem: {
    flex: 1,
    alignItems: "center",
  },
  usageDivider: {
    width: 1,
    marginHorizontal: spacing[4],
  },
  usageLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[1],
  },
  usageValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
  },
  benefitsContainer: {
    marginBottom: spacing[6],
  },
  benefitsTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[3],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing[2],
  },
  benefitText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[3],
  },
  upgradeButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.base,
    color: "white",
  },
  laterButton: {
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  laterButtonText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
  },
});

export default UpgradePrompt;
