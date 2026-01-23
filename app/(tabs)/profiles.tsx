import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Android renders fonts/icons larger, scale down for consistency
const uiScale = Platform.OS === "android" ? 0.85 : 1;
import { UpgradePrompt } from "../../src/components";
import { borderRadius, spacing } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";

const { width } = Dimensions.get("window");

const getCleanFileName = (path: string) => {
  if (!path) return "Resume";
  try {
    const decoded = decodeURIComponent(path);
    // Remove query params first
    const cleanPath = decoded.split("?")[0];
    // get basename
    return cleanPath.split("/").pop() || cleanPath;
  } catch {
    return path.split("/").pop() || path;
  }
};

// Profile card component
const ProfileCard: React.FC<{
  id: string;
  name: string;
  title: string;
  skills: string[];
  experience: string;
  isPrimary: boolean;
  gradient: string[];
  applicationsCount: number;
  matchScore: number;
  index: number;
  onPress: () => void;
  onSetPrimary: () => void;
  onEdit: () => void;
}> = ({
  name,
  title,
  skills,
  experience,
  isPrimary,
  gradient,
  applicationsCount,
  matchScore,
  index,
  onPress,
  onSetPrimary,
  onEdit,
}) => {
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        delay: 200 + index * 120,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay: 200 + index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

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
        styles.profileCard,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}
        >
          {isPrimary && (
            <View style={styles.primaryBadge}>
              <Ionicons name="star" size={Math.round(12 * uiScale)} color="#FFF" />
              <Text style={styles.primaryBadgeText}>Primary</Text>
            </View>
          )}
          <View style={styles.profileAvatarContainer}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{name.charAt(0)}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileTitle}>{title}</Text>

          {/* Stats */}
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{applicationsCount}</Text>
              <Text style={styles.profileStatLabel}>Applications</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{matchScore}%</Text>
              <Text style={styles.profileStatLabel}>Avg Match</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{experience}</Text>
              <Text style={styles.profileStatLabel}>Experience</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Card Body */}
        <View
          style={[
            styles.profileBody,
            {
              backgroundColor: isDark
                ? colors.surfaceSecondary
                : colors.surface,
            },
          ]}
        >
          {/* Skills */}
          <View style={styles.skillsSection}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
            >
              Top Skills
            </Text>
            <View style={styles.skillsRow}>
              {skills.slice(0, 4).map((skill, i) => (
                <View
                  key={skill}
                  style={[
                    styles.skillChip,
                    { backgroundColor: gradient[0] + "20" },
                  ]}
                >
                  <Text style={[styles.skillText, { color: gradient[0] }]}>
                    {skill}
                  </Text>
                </View>
              ))}
              {skills.length > 4 && (
                <View
                  style={[
                    styles.skillChip,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceSecondary
                        : colors.level1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.skillText, { color: colors.textSecondary }]}
                  >
                    +{skills.length - 4}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            {!isPrimary && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceSecondary
                      : colors.level1,
                  },
                ]}
                onPress={onSetPrimary}
              >
                <Ionicons
                  name="star-outline"
                  size={Math.round(18 * uiScale)}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.actionText, { color: colors.textSecondary }]}
                >
                  Set Primary
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.actionButton,
                { flex: 1, backgroundColor: gradient[0] + "15" },
              ]}
              onPress={onEdit}
            >
              <Ionicons name="create-outline" size={Math.round(18 * uiScale)} color={gradient[0]} />
              <Text style={[styles.actionText, { color: gradient[0] }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Resume card
const ResumeCard: React.FC<{
  name: string;
  lastUpdated: string;
  isActive: boolean;
  delay: number;
}> = ({ name, lastUpdated, isActive, delay }) => {
  const translateX = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
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

  return (
    <Animated.View
      style={[
        styles.resumeCard,
        {
          opacity,
          transform: [{ translateX }],
          backgroundColor: isDark ? colors.surfaceSecondary : colors.surface,
          borderColor: isActive ? colors.primary : "transparent",
        },
      ]}
    >
      <TouchableOpacity style={styles.resumeCardInner} activeOpacity={0.7}>
        <View
          style={[
            styles.resumeIcon,
            {
              backgroundColor: isActive ? "#0ea5e920" : colors.surfaceSecondary,
            },
          ]}
        >
          <Ionicons
            name="document-text"
            size={Math.round(22 * uiScale)}
            color={isActive ? colors.primary : colors.textSecondary}
          />
        </View>
        <View style={styles.resumeInfo}>
          <Text style={[styles.resumeName, { color: colors.text }]}>
            {name}
          </Text>
          <Text style={[styles.resumeDate, { color: colors.textSecondary }]}>
            Updated {lastUpdated}
          </Text>
        </View>
        {isActive && (
          <View style={styles.activeBadge}>
            <Ionicons
              name="checkmark-circle"
              size={Math.round(20 * uiScale)}
              color={colors.primary}
            />
          </View>
        )}
        <Ionicons
          name="chevron-forward"
          size={Math.round(20 * uiScale)}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

import { useFocusEffect } from "expo-router";
import { canCreateProfile } from "../../src/constants/subscription-limits";
import {
  applicationService,
  profileService,
  subscriptionService,
} from "../../src/services";
import { JobProfile, Resume } from "../../src/types";

export default function ProfilesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Subscription state
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState<{
    message: string;
    limitType: "profiles" | "resumes" | "applications";
    currentCount: number;
    limit: number;
  } | null>(null);

  // Header animation
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchData = React.useCallback(async () => {
    try {
      // Fetch subscription info
      try {
        const subscription = await subscriptionService.getCurrentSubscription();
        console.log(
          "[Profiles] Subscription fetched:",
          subscription?.tier,
          subscription?.status
        );
        setCurrentTier(subscription.tier || "free");
      } catch (err: any) {
        console.log("[Profiles] Failed to fetch subscription:", err?.message);
        setCurrentTier("free");
      }

      const fetchedProfilesRaw = await profileService.getProfiles();

      // Calculate stats
      let appCounts: Record<string, number> = {};
      try {
        const apps = await applicationService.getRecentApplications(100);
        apps.forEach((app) => {
          if (app.jobProfileId) {
            appCounts[app.jobProfileId] =
              (appCounts[app.jobProfileId] || 0) + 1;
          }
        });
      } catch (e) {
        console.log("Failed to fetch apps for stats", e);
      }

      const fetchedProfiles = fetchedProfilesRaw.map((p) => ({
        ...p,
        applicationCount: appCounts[p.id] || 0,
      }));

      setProfiles(fetchedProfiles);

      // Aggregate resumes from all profiles
      const allResumes: Resume[] = [];
      fetchedProfiles.forEach((p) => {
        if (p.resumes) {
          allResumes.push(...p.resumes);
        }
      });
      // Sort by uploadedAt (descending)
      allResumes.sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );

      setResumes(allResumes.slice(0, 5)); // Show top 5
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await profileService.setPrimaryProfile(id);
      fetchData();
    } catch (error) {
      console.error("Failed to set primary profile:", error);
    }
  };

  const handleCreateProfile = () => {
    const { allowed, limit, current } = canCreateProfile(
      currentTier,
      profiles.length
    );

    if (!allowed) {
      setUpgradePromptData({
        message: `You've reached the maximum of ${limit} profile${
          limit !== 1 ? "s" : ""
        } on your ${
          currentTier === "free" ? "Free" : currentTier
        } plan. Upgrade to create more profiles and unlock additional features.`,
        limitType: "profiles",
        currentCount: current,
        limit: limit,
      });
      setShowUpgradePrompt(true);
      return;
    }

    router.push("/profile/create");
  };

  const handleProfilePress = (id: string) => {
    router.push(`/profile/${id}`);
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Profiles</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {profiles.length} job profiles • {resumes.length} resumes
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateProfile}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={Math.round(24 * uiScale)} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Profiles Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Job Profiles
          </Text>
          {profiles.length === 0 && !isLoading ? (
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 20,
              }}
            >
              No job profiles found. Create one to get started!
            </Text>
          ) : (
            profiles.map((profile, index) => {
              // Generate consistent gradient based on index
              const gradients = [
                ["#0ea5e9", "#0284c7"],
                ["#F59E0B", "#EF4444"],
                ["#10B981", "#059669"],
                ["#8B5CF6", "#6D28D9"],
              ];
              const gradient = gradients[index % gradients.length];

              return (
                <ProfileCard
                  key={profile.id}
                  id={profile.id}
                  name={profile.name}
                  title={profile.headline || "Job Profile"}
                  skills={profile.skills || []}
                  experience={`${profile.yearsOfExperience || 0} yrs`}
                  isPrimary={profile.isPrimary}
                  gradient={gradient}
                  applicationsCount={(profile as any).applicationCount || 0}
                  matchScore={0} // Mock for now
                  index={index}
                  onPress={() => handleProfilePress(profile.id)}
                  onSetPrimary={() => handleSetPrimary(profile.id)}
                  onEdit={() => router.push(`/profile/edit/${profile.id}`)}
                />
              );
            })
          )}
        </View>

        {/* Resumes Section */}
        <View style={[styles.section, { paddingBottom: insets.bottom + 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Resumes
            </Text>
            {/* <TouchableOpacity>
              <Text style={styles.uploadText}>Upload New</Text>
            </TouchableOpacity> */}
          </View>
          {resumes.length === 0 && !isLoading ? (
            <Text style={{ color: colors.textSecondary, padding: 10 }}>
              No resumes found.
            </Text>
          ) : (
            resumes.map((resume, index) => {
              // Calculate relative time or simple date
              const date = new Date(resume.uploadedAt).toLocaleDateString();
              return (
                <ResumeCard
                  key={resume.id}
                  name={getCleanFileName(resume.fileName)}
                  lastUpdated={date}
                  isActive={resume.isPrimary}
                  delay={800 + index * 100}
                />
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Upgrade Prompt Modal */}
      {upgradePromptData && (
        <UpgradePrompt
          visible={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          title="Profile Limit Reached"
          message={upgradePromptData.message}
          currentTier={currentTier}
          limitType={upgradePromptData.limitType}
          currentCount={upgradePromptData.currentCount}
          limit={upgradePromptData.limit}
        />
      )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[8],
  },
  title: {
    fontSize: Math.round(32 * uiScale),
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Math.round(14 * uiScale),
    marginTop: spacing[1],
  },
  addButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonGradient: {
    width: Math.round(48 * uiScale),
    height: Math.round(48 * uiScale),
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: spacing[8],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: Math.round(20 * uiScale),
    fontWeight: "700",
    marginBottom: spacing[4],
  },
  uploadText: {
    fontSize: Math.round(15 * uiScale),
    color: "#0ea5e9",
    fontWeight: "600",
  },
  profileCard: {
    marginBottom: spacing[5],
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  profileHeader: {
    padding: spacing[5],
    alignItems: "center",
    position: "relative",
  },
  primaryBadge: {
    position: "absolute",
    top: spacing[4],
    right: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  primaryBadgeText: {
    color: "#FFF",
    fontSize: Math.round(12 * uiScale),
    fontWeight: "700",
  },
  profileAvatarContainer: {
    marginBottom: spacing[3],
  },
  profileAvatar: {
    width: Math.round(72 * uiScale),
    height: Math.round(72 * uiScale),
    borderRadius: Math.round(24 * uiScale),
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
  },
  profileAvatarText: {
    fontSize: Math.round(28 * uiScale),
    fontWeight: "800",
    color: "#FFF",
  },
  profileName: {
    fontSize: Math.round(22 * uiScale),
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: Math.round(14 * uiScale),
    color: "rgba(255,255,255,0.8)",
    marginBottom: spacing[4],
  },
  profileStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileStat: {
    alignItems: "center",
    paddingHorizontal: spacing[4],
  },
  profileStatValue: {
    fontSize: Math.round(20 * uiScale),
    fontWeight: "800",
    color: "#FFF",
  },
  profileStatLabel: {
    fontSize: Math.round(11 * uiScale),
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  profileBody: {
    padding: spacing[5],
  },
  skillsSection: {
    marginBottom: spacing[4],
  },
  sectionLabel: {
    fontSize: Math.round(13 * uiScale),
    fontWeight: "600",
    marginBottom: spacing[2],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  skillChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: borderRadius.full,
  },
  skillText: {
    fontSize: Math.round(13 * uiScale),
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  actionText: {
    fontSize: Math.round(14 * uiScale),
    fontWeight: "600",
  },
  resumeCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing[3],
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resumeCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
  },
  resumeIcon: {
    width: Math.round(48 * uiScale),
    height: Math.round(48 * uiScale),
    borderRadius: Math.round(14 * uiScale),
    justifyContent: "center",
    alignItems: "center",
  },
  resumeInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },
  resumeName: {
    fontSize: Math.round(15 * uiScale),
    fontWeight: "600",
  },
  resumeDate: {
    fontSize: Math.round(13 * uiScale),
    marginTop: 2,
  },
  activeBadge: {
    marginRight: spacing[2],
  },
});
