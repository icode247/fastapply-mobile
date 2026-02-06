import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../src/components/ui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card } from "../../src/components";
import {
  PLAN_LIMITS,
  PlanTier,
  getPlanDisplayName,
  isUnlimited,
} from "../../src/constants/subscription-limits";
import { borderRadius, spacing, typography } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { subscriptionService } from "../../src/services";
import { Subscription } from "../../src/types";

// Pricing data (mock)
// Pricing data
type BillingCycle = "monthly" | "yearly";

const PRICING_DATA: Record<BillingCycle, Partial<Record<PlanTier, string>>> = {
  monthly: {
    free: "$0",
    starter: "$15/mo",
    pro: "$25/mo",
    unlimited: "$40/mo",
    enterprise: "Contact Sales",
  },
  yearly: {
    free: "$0",
    starter: "$8.34/mo",
    pro: "$17.34/mo",
    unlimited: "$29.34/mo",
    enterprise: "Contact Sales",
  },
};

const BILLING_TEXT: Record<BillingCycle, Partial<Record<PlanTier, string>>> = {
  monthly: {
    starter: "Billed monthly",
    pro: "Billed monthly",
    unlimited: "Billed monthly",
  },
  yearly: {
    starter: "Billed $100 yearly",
    pro: "Billed $208 yearly",
    unlimited: "Billed $352 yearly",
  },
};

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [currentSubscription, setCurrentSubscription] =
    useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const sub = await subscriptionService.getCurrentSubscription();
      setCurrentSubscription(sub);
    } catch (error) {
      console.error("Failed to load subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: PlanTier) => {
    try {
      await Linking.openURL(
        `https://fastapply.co/pricing?plan=${tier}&billing=${billingCycle}`
      );
    } catch (error) {
      Alert.alert("Error", "Could not open pricing page");
    }
  };

  const renderFeature = (text: string, included: boolean) => (
    <View style={styles.featureRow}>
      <Ionicons
        name={included ? "checkmark-circle" : "close-circle"}
        size={20}
        color={included ? "#10B981" : "#EF4444"}
      />
      <Text style={[styles.featureText, { color: colors.text }]}>{text}</Text>
    </View>
  );

  const renderBadge = (tier: PlanTier) => {
    if (tier === "pro") {
      return (
        <View style={[styles.badgeContainer, { backgroundColor: "#F59E0B" }]}>
          <Text style={styles.badgeText}>🔥 Most Popular</Text>
        </View>
      );
    }
    if (tier === "unlimited") {
      return (
        <View style={[styles.badgeContainer, { backgroundColor: "#10B981" }]}>
          <Text style={styles.badgeText}>⚡ Best Value</Text>
        </View>
      );
    }
    return null;
  };

  const renderPlanCard = (tier: PlanTier) => {
    const limits = PLAN_LIMITS[tier];
    const isCurrent = currentSubscription?.tier === tier;
    const price = PRICING_DATA[billingCycle][tier];
    const billingText = BILLING_TEXT[billingCycle][tier];
    const displayName = getPlanDisplayName(tier);

    // Filter out enterprise for now unless user is enterprise
    if (tier === "enterprise" && currentSubscription?.tier !== "enterprise")
      return null;

    return (
      <View key={tier}>
        {renderBadge(tier)}
        <Card
          style={[
            styles.planCard,
            isCurrent && { borderColor: colors.primary, borderWidth: 2 },
            (tier === "pro" || tier === "unlimited") && {
              marginTop: 0,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
            },
          ]}
        >
          <View style={styles.planHeader}>
            <View>
              <Text style={[styles.planName, { color: colors.text }]}>
                {displayName}
              </Text>
              <Text style={[styles.planPrice, { color: colors.primary }]}>
                {price}
              </Text>
              {billingText && (
                <Text
                  style={[styles.billingText, { color: colors.textSecondary }]}
                >
                  {billingText}
                </Text>
              )}
            </View>
            {isCurrent && (
              <View
                style={[
                  styles.currentBadge,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text
                  style={[styles.currentBadgeText, { color: colors.primary }]}
                >
                  Current
                </Text>
              </View>
            )}
          </View>

          <View style={styles.featuresList}>
            {tier !== "free" &&
              renderFeature("All 12+ supported job boards", true)}
            {renderFeature(
              `${
                isUnlimited(limits.maxProfiles)
                  ? "Unlimited"
                  : limits.maxProfiles
              } Resume Profiles`,
              true
            )}
            {renderFeature(
              `${
                isUnlimited(limits.maxResumesPerProfile)
                  ? "Unlimited"
                  : limits.maxResumesPerProfile
              } Resume/CV uploads`,
              true
            )}
            {renderFeature(
              limits.hasAiTailoredResume
                ? "AI Tailored Resume per job"
                : "AI Tailored Resume",
              limits.hasAiTailoredResume
            )}
            {renderFeature(
              limits.hasAiTailoredCoverLetter
                ? "AI Tailored Cover Letter per job"
                : "AI Tailored Cover Letter",
              limits.hasAiTailoredCoverLetter
            )}
            {renderFeature("Smart application tracking", true)}
            {renderFeature(
              limits.hasPrioritySupport ? "Priority Support" : "Email Support",
              true
            )}
            {renderFeature(
              `${
                isUnlimited(limits.maxApplicationsPerDay)
                  ? "Unlimited"
                  : limits.maxApplicationsPerDay
              } applications/day`,
              limits.maxApplicationsPerDay !== 0
            )}
          </View>

          <Button
            title={isCurrent ? "Current Plan" : `Upgrade to ${displayName}`}
            variant={isCurrent ? "outline" : "primary"}
            onPress={() => !isCurrent && handleUpgrade(tier)}
            disabled={isCurrent}
            style={styles.upgradeButton}
          />
        </Card>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing[2],
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Subscription Plans
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing[4] },
        ]}
      >
        {/* Billing Cycle Switcher */}
        <View
          style={[
            styles.switcherContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.switcherOption,
              billingCycle === "monthly" && { backgroundColor: colors.primary },
            ]}
            onPress={() => setBillingCycle("monthly")}
          >
            <Text
              style={[
                styles.switcherText,
                { color: billingCycle === "monthly" ? "white" : colors.text },
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.switcherOption,
              billingCycle === "yearly" && { backgroundColor: colors.primary },
            ]}
            onPress={() => setBillingCycle("yearly")}
          >
            <Text
              style={[
                styles.switcherText,
                { color: billingCycle === "yearly" ? "white" : colors.text },
              ]}
            >
              Yearly (Save 30%)
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text
            style={{
              textAlign: "center",
              marginTop: 20,
              color: colors.textSecondary,
            }}
          >
            Loading plans...
          </Text>
        ) : (
          <>
            {renderPlanCard("free")}
            {renderPlanCard("starter")}
            {renderPlanCard("pro")}
            {renderPlanCard("unlimited")}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing[1],
  },
  title: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: spacing[4],
  },
  switcherContainer: {
    flexDirection: "row",
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing[6],
    marginHorizontal: spacing[2],
  },
  switcherOption: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: "center",
    borderRadius: borderRadius.md,
  },
  switcherText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
  },
  billingText: {
    fontSize: 12,
    marginTop: 2,
  },
  planCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[4],
  },
  planName: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
  },
  planPrice: {
    fontSize: 16,
    fontFamily: typography.fontFamily.medium,
  },
  currentBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  currentBadgeText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
  },
  featuresList: {
    marginBottom: spacing[4],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  featureText: {
    marginLeft: spacing[2],
    fontSize: 14,
  },
  upgradeButton: {
    marginTop: spacing[2],
  },
  badgeContainer: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignSelf: "flex-start",
    marginLeft: 0,
    marginBottom: -1, // Overlap border
    zIndex: 1,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
