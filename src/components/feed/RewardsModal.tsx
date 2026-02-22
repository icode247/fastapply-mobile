import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Platform,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { borderRadius, spacing, typography, uiScale } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { useAuthStore } from "../../stores";
import { subscriptionService } from "../../services/subscription.service";
import { Text } from "../ui/Text";
import { BottomSheet } from "../ui/BottomSheet";

interface RewardsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    icon: "logo-instagram" as const,
    color: "#E4405F",
    url: "https://instagram.com/fastapply",
  },
  {
    name: "TikTok",
    icon: "logo-tiktok" as const,
    colorLight: "#000000",
    colorDark: "#FFFFFF",
    url: "https://tiktok.com/@fastapply",
  },
  {
    name: "X",
    icon: "logo-twitter" as const,
    colorLight: "#000000",
    colorDark: "#FFFFFF",
    url: "https://x.com/fastapply",
  },
  {
    name: "LinkedIn",
    icon: "logo-linkedin" as const,
    color: "#0A66C2",
    url: "https://linkedin.com/company/fastapply",
  },
];

export const RewardsModal: React.FC<RewardsModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);

  // Credits state
  const [creditsRemaining, setCreditsRemaining] = useState<number>(0);
  const [creditsTotal, setCreditsTotal] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Generate referral code from user ID
  const referralCode = user?.id
    ? `FAST-${user.id.slice(0, 6).toUpperCase()}`
    : "FAST-XXXX";

  // Content stagger animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const creditsAnim = useRef(new Animated.Value(0)).current;
  const socialAnim = useRef(new Animated.Value(0)).current;
  const referralAnim = useRef(new Animated.Value(0)).current;

  // Load credits when modal opens
  useEffect(() => {
    if (visible) {
      const loadCredits = async () => {
        try {
          const usage = await subscriptionService.getUsageStats();
          setCreditsRemaining(usage.creditsRemaining);
          setCreditsTotal(usage.creditsTotal);
        } catch {
          // Keep defaults
        }
      };
      loadCredits();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      // Reset
      headerAnim.setValue(0);
      creditsAnim.setValue(0);
      socialAnim.setValue(0);
      referralAnim.setValue(0);

      // Staggered content animations
      Animated.stagger(80, [
        Animated.spring(headerAnim, {
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
        Animated.spring(socialAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(referralAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Scout and get free credits! Use my referral code: ${referralCode}\n\nhttps://fastapply.co/refer?code=${referralCode}`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleOpenSocial = (url: string) => {
    Linking.openURL(url);
  };

  const getSocialColor = (social: (typeof SOCIAL_LINKS)[number]) => {
    if (social.color) return social.color;
    return isDark ? social.colorDark! : social.colorLight!;
  };

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

  const creditsPercent =
    creditsTotal > 0 ? Math.min(creditsRemaining / creditsTotal, 1) : 0;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Header */}
      <Animated.View
        style={[styles.headerSection, animatedEntry(headerAnim)]}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Earn Free Credits
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Follow us and invite friends to earn bonus credits
        </Text>
      </Animated.View>

      {/* Credits Card */}
      <Animated.View
        style={[
          styles.creditsCard,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
          },
          animatedEntry(creditsAnim),
        ]}
      >
        <View style={styles.creditsHeader}>
          <Text
            style={[styles.creditsLabel, { color: colors.textSecondary }]}
          >
            Credits Available
          </Text>
          <Text style={[styles.creditsCount, { color: colors.primary }]}>
            {creditsRemaining}
            <Text
              style={[
                styles.creditsTotalText,
                { color: colors.textTertiary },
              ]}
            >
              {" "}
              / {creditsTotal}
            </Text>
          </Text>
        </View>
        <View
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
        >
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

      {/* Social Section */}
      <Animated.View style={animatedEntry(socialAnim)}>
        <Text
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Follow us for bonus credits
        </Text>
        <View style={styles.socialRow}>
          {SOCIAL_LINKS.map((social) => (
            <TouchableOpacity
              key={social.name}
              style={[
                styles.socialButton,
                {
                  backgroundColor: getSocialColor(social) + "15",
                },
              ]}
              onPress={() => handleOpenSocial(social.url)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={social.icon}
                size={Math.round(24 * uiScale)}
                color={getSocialColor(social)}
              />
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Referral Section */}
      <Animated.View style={animatedEntry(referralAnim)}>
        <Text
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          Invite friends, earn credits
        </Text>
        <Text
          style={[
            styles.referralDescription,
            { color: colors.textSecondary },
          ]}
        >
          Share your code — get 5 credits for each friend who signs up
        </Text>

        {/* Referral Code Box */}
        <View
          style={[
            styles.codeBox,
            {
              borderColor: colors.border,
              backgroundColor: colors.surfaceSecondary,
              borderStyle: Platform.OS === "android" ? "solid" : "dashed",
            },
          ]}
        >
          <Text style={[styles.codeText, { color: colors.text }]}>
            {referralCode}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: copied
                  ? colors.primary + "15"
                  : colors.surfaceSecondary,
                borderColor: copied ? colors.primary : colors.border,
              },
            ]}
            onPress={handleCopyCode}
            activeOpacity={0.7}
          >
            <Ionicons
              name={copied ? "checkmark-circle" : "copy-outline"}
              size={Math.round(18 * uiScale)}
              color={copied ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.actionButtonText,
                {
                  color: copied ? colors.primary : colors.text,
                },
              ]}
            >
              {copied ? "Copied!" : "Copy Code"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Ionicons
              name="share-outline"
              size={Math.round(18 * uiScale)}
              color="#FFFFFF"
            />
            <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  // Header
  headerSection: {
    marginBottom: spacing[5],
    marginTop: spacing[3],
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "700",
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
  },

  // Credits Card
  creditsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[5],
    borderWidth: 1,
  },
  creditsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  creditsLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
  },
  creditsCount: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
  },
  creditsTotalText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "400",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Social Section
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    marginBottom: spacing[3],
  },
  socialRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  socialButton: {
    width: Math.round(48 * uiScale),
    height: Math.round(48 * uiScale),
    borderRadius: Math.round(24 * uiScale),
    justifyContent: "center",
    alignItems: "center",
  },

  // Referral Section
  referralDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  codeBox: {
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    alignItems: "center",
    marginBottom: spacing[3],
  },
  codeText: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
  },
});

export default RewardsModal;
