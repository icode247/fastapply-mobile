import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { borderRadius, spacing, typography, uiScale } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { applicationService } from "../../services/application.service";
import { subscriptionService } from "../../services/subscription.service";
import { ApplicationStats } from "../../types/application.types";
import { SubscriptionTier, UsageStats } from "../../types/subscription.types";
import { Text } from "../ui/Text";
import { BottomSheet } from "../ui/BottomSheet";

interface StatsModalProps {
  visible: boolean;
  onClose: () => void;
}

const TIER_COLORS: Record<string, string> = {
  free: "#636B74",
  starter: "#0B6BCB",
  pro: "#7C3AED",
  unlimited: "#F59E0B",
  enterprise: "#10B981",
};

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  unlimited: "Unlimited",
  enterprise: "Enterprise",
};

export const StatsModal: React.FC<StatsModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();

  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [appStats, setAppStats] = useState<ApplicationStats | null>(null);
  const [tier, setTier] = useState<SubscriptionTier>("free");

  // Stagger animations
  const heroAnim = useRef(new Animated.Value(0)).current;
  const rowsAnim = useRef(new Animated.Value(0)).current;
  const creditsAnim = useRef(new Animated.Value(0)).current;
  const upgradeAnim = useRef(new Animated.Value(0)).current;

  // Load data when modal opens
  useEffect(() => {
    if (visible) {
      const loadData = async () => {
        try {
          const [usageData, statsData, subData] = await Promise.all([
            subscriptionService.getUsageStats(),
            applicationService.getStats(),
            subscriptionService.getCurrentSubscription(),
          ]);
          setUsage(usageData);
          setAppStats(statsData);
          setTier((subData.tier || subData.planType || "free") as SubscriptionTier);
        } catch {
          // Keep defaults
        }
      };
      loadData();
    }
  }, [visible]);

  // Staggered entrance animations
  useEffect(() => {
    if (visible) {
      heroAnim.setValue(0);
      rowsAnim.setValue(0);
      creditsAnim.setValue(0);
      upgradeAnim.setValue(0);

      Animated.stagger(80, [
        Animated.spring(heroAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(rowsAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(creditsAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(upgradeAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const animatedEntry = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [15, 0],
        }),
      },
    ],
  });

  const total = appStats?.total ?? 0;
  const submitted = appStats?.submitted ?? 0;
  const completed = appStats?.completed ?? 0;
  const failed = appStats?.failed ?? 0;
  const successRate = total > 0 ? Math.round((submitted / total) * 100) : 0;
  const creditsRemaining = usage?.creditsRemaining ?? 0;
  const creditsTotal = usage?.creditsTotal ?? 0;
  const creditsPercent = creditsTotal > 0 ? Math.min(creditsRemaining / creditsTotal, 1) : 0;

  const tierColor = TIER_COLORS[tier] || TIER_COLORS.free;
  const tierLabel = TIER_LABELS[tier] || "Free";
  const showUpgrade = tier !== "unlimited" && tier !== "enterprise";

  const statRows = [
    { label: "Submitted", value: String(submitted) },
    { label: "Completed", value: String(completed) },
    { label: "Failed", value: String(failed), valueColor: failed > 0 ? "#EF4444" : undefined },
    { label: "This Month", value: String(usage?.applicationsThisMonth ?? 0) },
    { label: "Today", value: String(usage?.applicationsToday ?? 0) },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight="70%">
      {/* Hero: total + success rate + tier badge */}
      <Animated.View style={[styles.hero, animatedEntry(heroAnim)]}>
        <View style={styles.heroLeft}>
          <Text style={[styles.heroNumber, { color: colors.text }]}>
            {total}
          </Text>
          <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>
            Total Applications
          </Text>
        </View>
        <View style={styles.heroRight}>
          <View style={[styles.successRing, { borderColor: colors.primary }]}>
            <Text style={[styles.successValue, { color: colors.primary }]}>
              {successRate}%
            </Text>
          </View>
          <Text style={[styles.successLabel, { color: colors.textTertiary }]}>
            success
          </Text>
        </View>
      </Animated.View>

      {/* Tier badge */}
      <Animated.View style={animatedEntry(heroAnim)}>
        <View style={[styles.tierBadge, { backgroundColor: tierColor + "15" }]}>
          <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
          <Text style={[styles.tierText, { color: tierColor }]}>
            {tierLabel} Plan
          </Text>
        </View>
      </Animated.View>

      {/* Stat rows */}
      <Animated.View style={[styles.rowsSection, animatedEntry(rowsAnim)]}>
        {statRows.map((row, i) => (
          <View
            key={row.label}
            style={[
              styles.statRow,
              i < statRows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
            ]}
          >
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
              {row.label}
            </Text>
            <Text style={[styles.rowValue, { color: row.valueColor || colors.text }]}>
              {row.value}
            </Text>
          </View>
        ))}
      </Animated.View>

      {/* Credits bar */}
      <Animated.View style={[styles.creditsSection, animatedEntry(creditsAnim)]}>
        <View style={styles.creditsRow}>
          <Text style={[styles.creditsLabel, { color: colors.textSecondary }]}>
            Credits
          </Text>
          <Text style={[styles.creditsValue, { color: colors.text }]}>
            {creditsRemaining}
            <Text style={{ color: colors.textTertiary, fontWeight: "400" }}>
              {" "}/ {creditsTotal}
            </Text>
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${creditsPercent * 100}%`,
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Upgrade button */}
      {showUpgrade && (
        <Animated.View style={animatedEntry(upgradeAnim)}>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={() => Linking.openURL("https://fastapply.co/pricing")}
            activeOpacity={0.85}
          >
            <Ionicons
              name="rocket-outline"
              size={Math.round(18 * uiScale)}
              color="#FFFFFF"
            />
            <Text style={styles.upgradeText}>Upgrade Plan</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  // Hero
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  heroLeft: {},
  heroNumber: {
    fontSize: Math.round(48 * uiScale),
    fontWeight: "800",
    lineHeight: Math.round(52 * uiScale),
  },
  heroLabel: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  heroRight: {
    alignItems: "center",
  },
  successRing: {
    width: Math.round(64 * uiScale),
    height: Math.round(64 * uiScale),
    borderRadius: Math.round(32 * uiScale),
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  successValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
  },
  successLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: 4,
  },

  // Tier badge
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: borderRadius.xl,
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tierText: {
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
  },

  // Stat rows
  rowsSection: {
    marginBottom: spacing[4],
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  rowLabel: {
    fontSize: typography.fontSize.base,
  },
  rowValue: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },

  // Credits
  creditsSection: {
    marginBottom: spacing[4],
  },
  creditsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  creditsLabel: {
    fontSize: typography.fontSize.base,
  },
  creditsValue: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },

  // Upgrade
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
  },
  upgradeText: {
    color: "#FFFFFF",
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
});

export default StatsModal;
