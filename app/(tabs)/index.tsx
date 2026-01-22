import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, spacing } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { applicationService } from "../../src/services/application.service";
import { subscriptionService } from "../../src/services/subscription.service";
import { useAuthStore } from "../../src/stores";
import {
  Application,
  ApplicationStats,
  ApplicationStatus,
  Subscription,
  UsageStats,
} from "../../src/types";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - spacing[6] * 2 - spacing[4]) / 2;

// Helper function to format relative time
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Animated counter component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({
  value,
  duration = 1500,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(value * easeOutQuart));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <Text style={styles.statValue}>{displayValue}</Text>;
};

// Stats card with gradient and animation
const StatsCard: React.FC<{
  title: string;
  value: number;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  delay: number;
  onPress?: () => void;
}> = ({ title, value, subtitle, icon, gradient, delay, onPress }) => {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        delay,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 700,
        delay,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.statsCard,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <LinearGradient
          colors={gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statsCardGradient}
        >
          <View style={styles.statsCardIcon}>
            <Ionicons name={icon} size={24} color="rgba(255,255,255,0.9)" />
          </View>
          <AnimatedCounter value={value} />
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statSubtitle}>{subtitle}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Application card with status indicator
const ApplicationCard: React.FC<{
  company: string;
  position: string;
  status: ApplicationStatus | string;
  logo: string;
  time: string;
  delay: number;
  onPress: () => void;
}> = ({ company, position, status, logo, time, delay, onPress }) => {
  const translateX = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 600,
        delay,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const statusConfig: Record<
    string,
    { color: string; label: string; icon: string }
  > = {
    // Backend statuses
    submitted: { color: "#3B82F6", label: "Applied", icon: "checkmark-circle" },
    pending: { color: "#F59E0B", label: "Pending", icon: "time" },
    processing: { color: "#8B5CF6", label: "Processing", icon: "sync" },
    completed: {
      color: "#10B981",
      label: "Completed",
      icon: "checkmark-done-circle",
    },
    failed: { color: "#EF4444", label: "Failed", icon: "alert-circle" },
    cancelled: { color: "#6B7280", label: "Cancelled", icon: "close-circle" },
    // Legacy/UI statuses
    applied: { color: "#3B82F6", label: "Applied", icon: "checkmark-circle" },
    reviewing: { color: "#F59E0B", label: "In Review", icon: "eye" },
    interview: { color: "#0284c7", label: "Interview", icon: "calendar" },
    offer: { color: "#10B981", label: "Offer", icon: "trophy" },
    rejected: { color: "#EF4444", label: "Rejected", icon: "close-circle" },
  };

  const config = statusConfig[status] || statusConfig.submitted;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.applicationCard,
        {
          opacity,
          transform: [{ translateX }, { scale }],
          backgroundColor: isDark ? colors.surfaceSecondary : colors.surface,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.applicationCardInner}
      >
        <View
          style={[
            styles.applicationLogo,
            { backgroundColor: config.color + "20" },
          ]}
        >
          <Text style={[styles.logoText, { color: config.color }]}>{logo}</Text>
        </View>
        <View style={styles.applicationInfo}>
          <Text
            style={[styles.companyName, { color: colors.text }]}
            numberOfLines={1}
          >
            {company}
          </Text>
          <Text
            style={[styles.positionName, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {position}
          </Text>
          <Text
            style={[styles.applicationTime, { color: colors.textTertiary }]}
          >
            {time}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: config.color }]} />
          <Ionicons
            name={config.icon as keyof typeof Ionicons.glyphMap}
            size={16}
            color={config.color}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Quick action button
const QuickAction: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  delay: number;
}> = ({ icon, label, color, onPress, delay }) => {
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.quickAction,
          {
            backgroundColor: isDark ? colors.surfaceSecondary : colors.level1,
          },
        ]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <View
          style={[styles.quickActionIcon, { backgroundColor: color + "20" }]}
        >
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.quickActionLabel, { color: colors.text }]}>
          {label}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Credit usage ring
const CreditRing: React.FC<{ used: number; total: number }> = ({
  used,
  total,
}) => {
  const progress = useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();
  const percentage = (used / total) * 100;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: percentage,
      duration: 1500,
      delay: 500,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  return (
    <View style={styles.creditRingContainer}>
      <View
        style={[
          styles.creditRing,
          { borderColor: isDark ? colors.border : colors.borderLight },
        ]}
      >
        <LinearGradient
          colors={["#0ea5e9", "#0284c7", "#38bdf8"]}
          style={[
            styles.creditProgress,
            { transform: [{ rotate: `${(percentage / 100) * 360}deg` }] },
          ]}
        />
        <View
          style={[
            styles.creditRingInner,
            {
              backgroundColor: isDark
                ? colors.surfaceSecondary
                : colors.surface,
            },
          ]}
        >
          <Text style={[styles.creditValue, { color: colors.text }]}>
            {used}
          </Text>
          <Text style={[styles.creditLabel, { color: colors.textSecondary }]}>
            of {total}
          </Text>
        </View>
      </View>
      <Text style={[styles.creditTitle, { color: colors.text }]}>
        Credits Used
      </Text>
      <Text style={[styles.creditSubtitle, { color: colors.textSecondary }]}>
        This month
      </Text>
    </View>
  );
};

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, primaryJobProfile, isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // API Data State
  const [appStats, setAppStats] = useState<ApplicationStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [recentApplications, setRecentApplications] = useState<Application[]>(
    []
  );

  // Helper function to get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Helper function to get user display name (first name only for greeting)
  const getUserDisplayName = () => {
    // Try to get first name from profile first, then user, then fallback
    if (primaryJobProfile?.firstName) {
      return primaryJobProfile.firstName;
    }
    if (user?.name) {
      // Get first word from user name
      return user.name.split(" ")[0];
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "there";
  };

  // Header animation
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;

  const fetchDashboardData = useCallback(async () => {
    try {
      const [appStatsData, usageStatsData, subscriptionData, recentApps] =
        await Promise.all([
          applicationService.getStats(),
          subscriptionService.getUsageStats(),
          subscriptionService.getCurrentSubscription(),
          applicationService.getRecentApplications(5),
        ]);

      setAppStats(appStatsData);
      setUsageStats(usageStatsData);
      setSubscription(subscriptionData);
      setRecentApplications(recentApps);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Keep showing any existing data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Fetch data on mount only if authenticated
    if (isAuthenticated) {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [fetchDashboardData, isAuthenticated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  // Build stats from API data (fallback to 0 if not loaded)
  // API returns 'submitted' instead of 'applied', map accordingly
  const stats = [
    {
      title: "Applied",
      value: appStats?.submitted ?? appStats?.applied ?? 0,
      subtitle: "Sent",
      icon: "paper-plane" as const,
      gradient: [colors.primary, colors.primaryDark],
    },
    {
      title: "Processing",
      // Calculate processing if not explicitly returned: Total - Submitted - Failed - Pending
      value:
        appStats?.processing ??
        Math.max(
          0,
          (appStats?.total ?? 0) -
            (appStats?.submitted ?? 0) -
            (appStats?.failed ?? 0) -
            (appStats?.pending ?? 0)
        ),
      subtitle: "In Progress",
      icon: "sync" as const,
      gradient: [colors.warning, colors.warningDark],
    },
    {
      title: "Completed",
      // Completed might be same as submitted or different, using submitted as best proxy if 0
      value: appStats?.completed ?? appStats?.submitted ?? 0,
      subtitle: "Decisions",
      icon: "checkmark-circle" as const,
      gradient: [colors.success, colors.successDark],
    },
    {
      title: "Pending",
      value: appStats?.pending ?? 0,
      subtitle: "Queue",
      icon: "time" as const,
      gradient: [colors.error, colors.primaryDark],
    },
  ];

  // Transform recent applications for display
  const applications = (recentApplications || []).map((app) => ({
    id: app.id,
    company: app.company || "Unknown",
    position: app.jobTitle || "Position",
    status: app.status as
      | "applied"
      | "reviewing"
      | "interview"
      | "offer"
      | "rejected",
    logo: (app.company || "C")[0].toUpperCase(),
    time: getRelativeTime(app.createdAt),
  }));

  // Determine if user has unlimited plan based on subscription tier or high credit limit
  const isUnlimited =
    subscription?.tier === "unlimited" ||
    subscription?.tier === "enterprise" ||
    usageStats?.subscription?.tier === "unlimited" ||
    usageStats?.subscription?.tier === "enterprise" ||
    (usageStats?.creditsTotal ?? 0) === -1 ||
    (usageStats?.creditsRemaining ?? 0) > 2000000;

  const quickActions = [
    {
      icon: "add-circle" as const,
      label: "New Application",
      color: "#0ea5e9",
      onPress: () => router.push("/(tabs)/feed"),
    },
    {
      icon: "document-text" as const,
      label: "Update Resume",
      color: "#10B981",
      onPress: () => router.push("/(tabs)/profiles"),
    },
    {
      icon: "analytics" as const,
      label: "View Analytics",
      color: "#F59E0B",
      onPress: () => router.push("/(tabs)/applications"),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Status bar background */}
      <View
        style={[
          styles.statusBarBackground,
          { backgroundColor: colors.background, height: insets.top },
        ]}
      />
      {/* Header gradient overlay */}
      <LinearGradient
        colors={[colors.background, "transparent"]}
        style={[styles.headerGradient, { top: insets.top }]}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {getUserDisplayName()} 👋
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <BlurView
              intensity={20}
              tint={isDark ? "dark" : "light"}
              style={[styles.notificationBtnBlur, { borderColor: colors.border }]}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.text}
              />
              <View style={[styles.notificationDot, { borderColor: colors.background }]} />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <StatsCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              gradient={stat.gradient}
              delay={200 + index * 100}
            />
          ))}
        </View>

        {/* Credits section */}
        <View style={[styles.section, styles.creditsSection]}>
          <BlurView
            intensity={isDark ? 30 : 50}
            tint={isDark ? "dark" : "light"}
            style={styles.creditsSectionBlur}
          >
            <CreditRing
              used={usageStats?.creditsUsed ?? 0}
              total={
                usageStats?.creditsTotal === -1 || isUnlimited
                  ? Math.max(100, usageStats?.creditsUsed ?? 0)
                  : usageStats?.creditsTotal ?? 100
              }
            />
            <View style={styles.creditsInfo}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isUnlimited ? "Unlimited Plan" : "Credits Usage"}
              </Text>
              <Text
                style={[
                  styles.creditDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {isUnlimited
                  ? `${
                      usageStats?.applicationsThisMonth ??
                      appStats?.thisMonth ??
                      0
                    } applications this month • Unlimited credits`
                  : `${usageStats?.creditsRemaining ?? 0} credits remaining${
                      usageStats?.applicationsThisMonth
                        ? ` • ${usageStats.applicationsThisMonth} applications this month`
                        : ""
                    }`}
              </Text>
              {/* Only show upgrade button if not unlimited */}
              {!isUnlimited && (
                <TouchableOpacity style={styles.upgradeBtn}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.upgradeBtnGradient}
                  >
                    <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
                    <Ionicons name="sparkles" size={16} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </BlurView>
        </View>

        {/* Recent Applications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Applications
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/applications")}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.applicationsList}>
            {applications.map((app, index) => (
              <ApplicationCard
                key={app.id}
                {...app}
                delay={800 + index * 100}
                onPress={() => router.push(`/application/${index + 1}`)}
              />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { paddingBottom: insets.bottom + 100 }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, marginBottom: spacing[4] },
            ]}
          >
            Quick Actions
          </Text>
          {quickActions.map((action, index) => (
            <QuickAction
              key={action.label}
              {...action}
              delay={1200 + index * 100}
              onPress={action.onPress}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 200,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[8],
  },
  greeting: {
    fontSize: 16,
    fontWeight: "500",
  },
  userName: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: spacing[1],
  },
  notificationBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  notificationBtnBlur: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  notificationDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing[2],
    marginBottom: spacing[6],
  },
  statsCard: {
    width: CARD_WIDTH,
    marginHorizontal: spacing[2],
    marginBottom: spacing[4],
  },
  statsCardGradient: {
    padding: spacing[5],
    borderRadius: borderRadius.xl,
    minHeight: 140,
  },
  statsCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  statValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: spacing[1],
  },
  statSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  seeAllText: {
    fontSize: 15,
    color: "#0ea5e9",
    fontWeight: "600",
  },
  creditsSection: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  creditsSectionBlur: {
    flexDirection: "row",
    padding: spacing[5],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  creditRingContainer: {
    alignItems: "center",
    marginRight: spacing[5],
  },
  creditRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  creditProgress: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  creditRingInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  creditValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  creditLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  creditTitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  creditSubtitle: {
    fontSize: 11,
  },
  creditsInfo: {
    flex: 1,
    justifyContent: "center",
  },
  creditDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  upgradeBtn: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  upgradeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[2] + 2,
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  upgradeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
  applicationsList: {
    gap: spacing[3],
  },
  applicationCard: {
    borderRadius: borderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  applicationCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
  },
  applicationLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "800",
  },
  applicationInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },
  companyName: {
    fontSize: 16,
    fontWeight: "700",
  },
  positionName: {
    fontSize: 14,
    marginTop: 2,
  },
  applicationTime: {
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[3],
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[4],
  },
  quickActionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
});
