import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../src/components/ui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmModal } from "../../src/components";
import { getPlanDisplayName } from "../../src/constants/subscription-limits";
import { borderRadius, spacing, uiScale } from "../../src/constants/theme";
import { useAuth, useTheme } from "../../src/hooks";
import {
  notificationService,
  subscriptionService,
  userService,
} from "../../src/services";
import { Subscription, User } from "../../src/types";
import { storage } from "../../src/utils/storage";

// Setting item component
const SettingItem: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  isDestructive?: boolean;
  delay: number;
  colors: any;
  isDark: boolean;
}> = ({
  icon,
  iconColor,
  label,
  value,
  onPress,
  isSwitch,
  switchValue,
  onSwitchChange,
  isDestructive,
  delay,
  colors,
  isDark,
}) => {
  const translateX = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 500,
        delay,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const handlePressIn = () => {
    if (!isSwitch) {
      Animated.spring(scale, {
        toValue: 0.98,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!isSwitch) {
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Animated.View
      style={[
        styles.settingItem,
        {
          opacity,
          transform: [{ translateX }, { scale }],
          backgroundColor: isDark ? colors.surfaceSecondary : colors.surface,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.settingItemInner}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={isSwitch ? 1 : 0.7}
        disabled={isSwitch}
      >
        <View
          style={[styles.settingIcon, { backgroundColor: iconColor + "20" }]}
        >
          <Ionicons name={icon} size={Math.round(20 * uiScale)} color={iconColor} />
        </View>
        <View style={styles.settingContent}>
          <Text
            style={[
              styles.settingLabel,
              { color: isDestructive ? colors.error : colors.text },
            ]}
          >
            {label}
          </Text>
          {value && (
            <Text
              style={[styles.settingValue, { color: colors.textSecondary }]}
            >
              {value}
            </Text>
          )}
        </View>
        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{
              false: isDark ? colors.border : colors.borderLight,
              true: colors.primary,
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={isDark ? colors.level2 : colors.borderLight}
          />
        ) : (
          <Ionicons
            name="chevron-forward"
            size={Math.round(20 * uiScale)}
            color={colors.textTertiary}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Settings section
const SettingsSection: React.FC<{
  title: string;
  children: React.ReactNode;
  delay: number;
  colors: any;
}> = ({ title, children, delay, colors }) => {
  const titleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 400,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay]);

  return (
    <View style={styles.section}>
      <Animated.Text
        style={[
          styles.sectionTitle,
          { color: colors.textSecondary, opacity: titleOpacity },
        ]}
      >
        {title}
      </Animated.Text>
      <View style={styles.sectionItems}>{children}</View>
    </View>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, setMode, mode } = useTheme();
  const { logout } = useAuth();

  const [notifications, setNotifications] = useState(false);

  // User and subscription data
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Modal State
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Header animation
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const profileScale = useRef(new Animated.Value(0.8)).current;

  // Load preferences from storage
  const loadPreferences = useCallback(async () => {
    try {
      const notifPref = await storage.getItem("pref_notifications");
      if (notifPref !== null) setNotifications(notifPref === "true");
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  }, []);

  // Fetch user and subscription data
  const fetchData = useCallback(async () => {
    try {
      const [userData, subData] = await Promise.all([
        userService.getMe().catch((err) => {
          console.log("[Settings] Failed to fetch user:", err?.message);
          return null;
        }),
        subscriptionService.getCurrentSubscription().catch((err) => {
          console.log("[Settings] Failed to fetch subscription:", err?.message);
          return null;
        }),
      ]);
      console.log("[Settings] User data:", userData?.email);
      console.log(
        "[Settings] Subscription data:",
        subData?.tier,
        subData?.status
      );
      if (userData) setUser(userData);
      if (subData) setSubscription(subData);
    } catch (error) {
      console.error("Failed to fetch settings data:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      loadPreferences();
    }, [fetchData, loadPreferences])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(profileScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Push notification handler
  const handleNotificationsChange = async (value: boolean) => {
    if (value) {
      const token =
        await notificationService.registerForPushNotificationsAsync();
      if (token) {
        await notificationService.updateServerToken(token);
        setNotifications(true);
        await storage.setItem("pref_notifications", "true");
      } else {
        Alert.alert(
          "Notifications",
          "Unable to enable push notifications. Please check your device settings."
        );
      }
    } else {
      setNotifications(false);
      await storage.setItem("pref_notifications", "false");
    }
  };

  const handleSubscription = () => {
    router.push("/settings/subscription");
  };

  // Support handlers
  const handleHelpCenter = async () => {
    const url = "https://fastapply.co/help";
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const handleContactSupport = async () => {
    // Replace with your actual WhatsApp Business number (digits only, with country code)
    const whatsappNumber = "14XXXXXXXXX"; // TODO: Replace with actual number
    const message = "Hi, I need help with Scout.";
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        "Contact Support",
        "WhatsApp is not installed. Please install WhatsApp to contact support."
      );
    }
  };

  const handleRateApp = async () => {
    // TODO: Replace with actual App Store / Play Store URLs
    const url = Platform.OS === "ios"
      ? "https://apps.apple.com/app/fastapply"
      : "https://play.google.com/store/apps/details?id=com.fastapply";
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const handlePrivacyPolicy = async () => {
    const url = "https://fastapply.co/privacy";
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const processLogout = async () => {
    setActionLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setActionLoading(false);
      setLogoutModalVisible(false);
    }
  };

  const handleDeleteAccount = () => {
    setDeleteModalVisible(true);
  };

  const processDeleteAccount = async () => {
    setActionLoading(true);
    try {
      await userService.deleteAccount();
      await logout();
    } catch (error) {
      console.error("Delete account failed", error);
      // We might want to show an error toast here if we had one
    } finally {
      setActionLoading(false);
      setDeleteModalVisible(false);
    }
  };

  // Helper functions
  const getUserInitials = () => {
    if (!user?.name) return user?.email?.slice(0, 2).toUpperCase() || "??";
    const parts = user.name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  };

  const getPlanName = () => {
    if (!subscription) return "Free";
    return getPlanDisplayName(subscription.tier);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Status bar background */}
      <View
        style={[
          styles.statusBarBackground,
          { backgroundColor: colors.background, height: insets.top },
        ]}
      />
      {/* Header gradient */}
      <LinearGradient
        colors={[colors.background, colors.background]}
        style={[styles.headerGradient, { top: insets.top }]}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </Animated.View>

        {/* Profile Card */}
        <Animated.View
          style={[
            styles.profileCard,
            {
              transform: [{ scale: profileScale }],
              backgroundColor: isDark
                ? colors.surfaceSecondary
                : colors.surface,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.profileCardInner}
            activeOpacity={0.7}
            onPress={handleSubscription}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.profileAvatar}
            >
              <Text style={styles.avatarText}>{getUserInitials()}</Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.name || user?.email?.split("@")[0] || "User"}
              </Text>
              <Text
                style={[styles.profileEmail, { color: colors.textSecondary }]}
              >
                {user?.email || "Loading..."}
              </Text>
              <View style={styles.planBadge}>
                <LinearGradient
                  colors={
                    subscription?.tier === "free"
                      ? [colors.secondary, colors.secondaryDark]
                      : [colors.warning, colors.error]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.planBadgeGradient}
                >
                  <Ionicons
                    name={subscription?.tier === "free" ? "person" : "sparkles"}
                    size={Math.round(12 * uiScale)}
                    color={colors.textInverse}
                  />
                  <Text style={styles.planBadgeText}>{getPlanName()}</Text>
                </LinearGradient>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={Math.round(22 * uiScale)}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Subscription Banner - Only show for free users */}
        {(!subscription || subscription.tier === "free") && (
          <Animated.View style={{ opacity: headerOpacity }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push("/settings/subscription")}
            >
              <LinearGradient
                colors={["#4F46E5", "#7C3AED"]} // Premium purple/indigo gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.subscriptionBanner}
              >
                <View style={styles.subscriptionContent}>
                  <View style={styles.subscriptionIcon}>
                    <Ionicons name="sparkles" size={Math.round(28 * uiScale)} color={colors.textInverse} />
                  </View>
                  <View style={styles.subscriptionInfo}>
                    <Text style={styles.subscriptionTitle}>
                      Upgrade to Unlimited
                    </Text>
                    <Text style={styles.subscriptionDesc}>
                      Unlimited applications • Priority support
                    </Text>
                  </View>
                  <View style={styles.subscriptionArrow}>
                    <Ionicons name="arrow-forward" size={Math.round(20 * uiScale)} color={colors.textInverse} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Account Section */}
        <SettingsSection title="ACCOUNT" delay={100} colors={colors}>
          <SettingItem
            icon="card-outline"
            iconColor={colors.success}
            label="Subscription"
            value={getPlanName()}
            delay={150}
            colors={colors}
            isDark={isDark}
            onPress={handleSubscription}
          />
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection title="PREFERENCES" delay={300} colors={colors}>
          <SettingItem
            icon="notifications-outline"
            iconColor={colors.primary}
            label="Push Notifications"
            delay={350}
            colors={colors}
            isDark={isDark}
            isSwitch
            switchValue={notifications}
            onSwitchChange={handleNotificationsChange}
          />
          {/* <SettingItem
            icon="finger-print-outline"
            iconColor="#EC4899"
            label={Platform.OS === "ios" ? "Face ID / Touch ID" : "Biometric Login"}
            delay={400}
            colors={colors}
            isDark={isDark}
            isSwitch
            switchValue={false}
            onSwitchChange={() => {}}
          /> */}
          <SettingItem
            icon={isDark ? "moon-outline" : "sunny-outline"}
            iconColor={isDark ? colors.warning : colors.primary}
            label="Dark Mode"
            delay={400}
            colors={colors}
            isDark={isDark}
            isSwitch
            switchValue={isDark}
            onSwitchChange={(value) => setMode(value ? "dark" : "light")}
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title="SUPPORT" delay={550} colors={colors}>
          <SettingItem
            icon="help-circle-outline"
            iconColor={colors.primary}
            label="Help Center"
            delay={600}
            colors={colors}
            isDark={isDark}
            onPress={handleHelpCenter}
          />
          <SettingItem
            icon="logo-whatsapp"
            iconColor="#25D366"
            label="Contact Support"
            delay={650}
            colors={colors}
            isDark={isDark}
            onPress={handleContactSupport}
          />
          <SettingItem
            icon="star-outline"
            iconColor={colors.warning}
            label="Rate the App"
            delay={700}
            colors={colors}
            isDark={isDark}
            onPress={handleRateApp}
          />
          <SettingItem
            icon="document-text-outline"
            iconColor={colors.primary}
            label="Privacy Policy"
            delay={750}
            colors={colors}
            isDark={isDark}
            onPress={handlePrivacyPolicy}
          />
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="DANGER ZONE" delay={800} colors={colors}>
          <SettingItem
            icon="log-out-outline"
            iconColor={colors.error}
            label="Sign Out"
            delay={850}
            colors={colors}
            isDark={isDark}
            isDestructive
            onPress={handleLogout}
          />
          <SettingItem
            icon="trash-outline"
            iconColor={colors.error}
            label="Delete Account"
            delay={900}
            colors={colors}
            isDark={isDark}
            isDestructive
            onPress={handleDeleteAccount}
          />
        </SettingsSection>

        {/* App Version */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 100 }]}>
          <Text style={[styles.footerBrand, { color: colors.text }]}>
            Scout
          </Text>
          <Text style={[styles.footerPoweredBy, { color: colors.textTertiary }]}>
            powered by FastApply
          </Text>
          <Text style={[styles.copyrightText, { color: colors.textTertiary }]}>
            v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <ConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={processLogout}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        type="danger"
        loading={actionLoading}
      />

      <ConfirmModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={processDeleteAccount}
        title="Delete Account"
        message="This action is irreversible. All your data will be permanently deleted."
        confirmText="Delete"
        type="danger"
        loading={actionLoading}
      />
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
  },
  header: {
    marginBottom: spacing[6],
  },
  title: {
    fontSize: Math.round(32 * uiScale),
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  profileCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing[5],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  profileCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
  },
  profileAvatar: {
    width: Math.round(60 * uiScale),
    height: Math.round(60 * uiScale),
    borderRadius: Math.round(20 * uiScale),
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: Math.round(22 * uiScale),
    fontWeight: "800",
    color: "#FFF",
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },
  profileName: {
    fontSize: Math.round(18 * uiScale),
    fontWeight: "700",
  },
  profileEmail: {
    fontSize: Math.round(14 * uiScale),
    marginTop: 2,
  },
  planBadge: {
    marginTop: spacing[2],
    alignSelf: "flex-start",
  },
  planBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  planBadgeText: {
    fontSize: Math.round(12 * uiScale),
    fontWeight: "700",
    color: "#FFF",
  },
  subscriptionBanner: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing[8],
    padding: spacing[5],
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  subscriptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  subscriptionIcon: {
    width: Math.round(52 * uiScale),
    height: Math.round(52 * uiScale),
    borderRadius: Math.round(16 * uiScale),
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  subscriptionInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },
  subscriptionTitle: {
    fontSize: Math.round(18 * uiScale),
    fontWeight: "800",
    color: "#FFF",
  },
  subscriptionDesc: {
    fontSize: Math.round(14 * uiScale),
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  subscriptionArrow: {
    width: Math.round(36 * uiScale),
    height: Math.round(36 * uiScale),
    borderRadius: Math.round(12 * uiScale),
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: Math.round(13 * uiScale),
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing[3],
    marginLeft: spacing[1],
  },
  sectionItems: {
    gap: spacing[3],
  },
  settingItem: {
    borderRadius: borderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItemInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
  },
  settingIcon: {
    width: Math.round(44 * uiScale),
    height: Math.round(44 * uiScale),
    borderRadius: Math.round(14 * uiScale),
    justifyContent: "center",
    alignItems: "center",
  },
  settingContent: {
    flex: 1,
    marginLeft: spacing[4],
  },
  settingLabel: {
    fontSize: Math.round(16 * uiScale),
    fontWeight: "600",
  },
  settingValue: {
    fontSize: Math.round(14 * uiScale),
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    paddingTop: spacing[8],
  },
  footerBrand: {
    fontSize: Math.round(18 * uiScale),
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  footerPoweredBy: {
    fontSize: Math.round(11 * uiScale),
    fontWeight: "500",
    marginTop: 2,
  },
  copyrightText: {
    fontSize: Math.round(11 * uiScale),
    marginTop: spacing[2],
  },
});
