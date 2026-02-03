import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as NavigationBar from "expo-navigation-bar";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  JobFilters,
  JobFiltersModal,
} from "../../src/components/feed/JobFiltersModal";
import { NotificationPermissionModal } from "../../src/components/feed/NotificationPermissionModal";
import {
  ProfileSelectorModal,
  ProfileSelection,
  ResumeSettings,
} from "../../src/components/feed/ProfileSelectorModal";
import { SwipeDeck, SwipeDeckRef } from "../../src/components/feed/SwipeDeck";
import { VoiceAutoPilotOverlay } from "../../src/components/feed/VoiceAutoPilotOverlay";
import { spacing, typography } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { useAutomation } from "../../src/hooks/useAutomation";
import { useSwipeBatchQueue } from "../../src/hooks/useSwipeBatchQueue";
import { automationService } from "../../src/services/automation.service";
import { notificationService } from "../../src/services/notification.service";
import { storage } from "../../src/utils/storage";
import { jobService } from "../../src/services/job.service";
import { profileService } from "../../src/services/profile.service";
import {
  EmploymentType,
  NormalizedJob,
  WorkplaceType,
} from "../../src/types/job.types";
import { JobProfile } from "../../src/types/profile.types";
import { ParsedVoiceCommand } from "../../src/types/voice.types";

// Android renders fonts/icons larger, scale down for consistency
const uiScale = Platform.OS === "android" ? 0.85 : 1;

// Profile interface for ProfileSelectorModal
interface Profile {
  id: string;
  name: string;
  headline?: string;
  isComplete: boolean;
}

// Convert JobProfile to Profile format for modal
function toProfile(profile: JobProfile): Profile {
  // Consider a profile complete if it has basic info filled
  const hasBasicInfo = !!(
    profile.firstName &&
    profile.lastName &&
    profile.email
  );
  return {
    id: profile.id,
    name: profile.name,
    headline: profile.headline,
    isComplete: hasBasicInfo,
  };
}

// Legacy Job interface for backward compatibility with SwipeDeck
interface LegacyJob {
  id: string;
  title: string;
  company: string;
  logo: string;
  salary: string;
  type: string;
  workMode: string;
  location: string;
  experience: string;
  description: string;
  postedAt: string;
  tags: string[];
}

// Convert NormalizedJob to LegacyJob format for SwipeDeck
function toLegacyJob(job: NormalizedJob): LegacyJob {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    logo: job.logo,
    salary: job.salary,
    type: job.type,
    workMode: job.workMode,
    location: job.location,
    experience: job.experience,
    description: job.description,
    postedAt: job.postedAt,
    tags: job.tags,
  };
}

export default function FeedScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const swipeDeckRef = useRef<SwipeDeckRef>(null);

  // Actions container bottom offset
  const actionsBottomOffset = Platform.OS === "ios" ? insets.bottom - 23 : 100;

  // Load jobs from service
  const [jobs, setJobs] = useState<NormalizedJob[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);

  // Auto-pilot state
  const [isAutoPilotActive, setIsAutoPilotActive] = useState(false);
  const [autoPilotProgress, setAutoPilotProgress] = useState({
    current: 0,
    total: 0,
  });
  const autoPilotRef = useRef<number | null>(null);

  // Card expanded state (full screen mode)
  const [isCardExpanded, setIsCardExpanded] = useState(false);

  // Swiping state (hide action buttons while swiping)
  const [isSwiping, setIsSwiping] = useState(false);

  // Set Android navigation bar color to match theme
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(colors.background);
      NavigationBar.setButtonStyleAsync(
        colors.background === "#FFFFFF" ||
          colors.background.toLowerCase() === "#fff"
          ? "dark"
          : "light",
      );
    }
  }, [colors.background]);

  // Modal states
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [filters, setFilters] = useState<JobFilters | null>(null);

  // Real profiles from backend
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );

  // Resume settings for automation
  const [resumeSettings, setResumeSettings] = useState<ResumeSettings>({
    useTailoredResume: false,
    resumeType: null,
    resumeTemplate: null,
  });

  // Fetch profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setProfilesLoading(true);
        const fetchedProfiles = await profileService.getProfiles();
        setProfiles(fetchedProfiles);

        // Select primary profile by default, or first profile
        const primaryProfile = fetchedProfiles.find((p) => p.isPrimary);
        if (primaryProfile) {
          setSelectedProfileId(primaryProfile.id);
        } else if (fetchedProfiles.length > 0) {
          setSelectedProfileId(fetchedProfiles[0].id);
        }

        console.log("Loaded profiles:", fetchedProfiles.length);

        // Clean up any cached data for profiles that no longer exist
        const validProfileIds = fetchedProfiles.map((p) => p.id);
        await automationService.cleanupInvalidProfiles(validProfileIds);
      } catch (error) {
        console.error("Failed to load profiles:", error);
      } finally {
        setProfilesLoading(false);
      }
    };

    loadProfiles();
  }, []);

  // Get selected profile
  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId),
    [profiles, selectedProfileId],
  );

  // Convert profiles to modal format
  const modalProfiles = useMemo(() => profiles.map(toProfile), [profiles]);

  // Convert jobs to legacy format for SwipeDeck
  const legacyJobs = useMemo(() => jobs.map(toLegacyJob), [jobs]);

  // Automation hook - for stats display only (queue happens directly via service)
  const { queueStats, pendingCount } = useAutomation({
    profileId: selectedProfileId,
    profileName: selectedProfile?.name,
  });

  // Batch queue hook - handles debounced batching of swiped jobs (silent/invisible to user)
  const {
    pendingJobs: batchPendingJobs,
    addSwipedJob,
    flushAndReset,
  } = useSwipeBatchQueue({
    profileId: selectedProfileId,
    profileName: selectedProfile?.name,
    resumeSettings,
    onBatchSent: (automation, jobCount) => {
      console.log(`Batch sent! ${jobCount} jobs queued to automation ${automation.id}`);
    },
    onBatchError: (error) => {
      console.error("Batch error:", error);
    },
  });

  // Load jobs on mount
  useEffect(() => {
    const allJobs = jobService.getAllJobs();
    setJobs(allJobs);

    // Log stats
    const stats = jobService.getStats();
    console.log("Loaded jobs:", stats);
  }, []);

  // Cleanup auto-pilot on unmount
  useEffect(() => {
    return () => {
      if (autoPilotRef.current) {
        clearInterval(autoPilotRef.current);
      }
    };
  }, []);

  // Check if we should show notification permission modal on first load
  useEffect(() => {
    const checkNotificationPermission = async () => {
      try {
        // TODO: REMOVE THIS LINE AFTER TESTING - forces modal to show
        await storage.removeItem("notification_modal_shown");

        // Check if user has already seen/dismissed the modal
        const hasSeenModal = await storage.getItem("notification_modal_shown");
        if (hasSeenModal === "true") {
          return;
        }

        // Show immediately - this is the first screen after login
        setShowNotificationModal(true);
      } catch (error) {
        console.error("Error checking notification permission:", error);
      }
    };

    checkNotificationPermission();
  }, []);

  // Handle enabling notifications
  const handleEnableNotifications = async () => {
    setShowNotificationModal(false);
    await storage.setItem("notification_modal_shown", "true");

    try {
      const token = await notificationService.registerForPushNotificationsAsync();
      if (token) {
        await notificationService.updateServerToken(token);
        console.log("Notifications enabled successfully");
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
    }
  };

  // Handle skipping notifications
  const handleSkipNotifications = async () => {
    setShowNotificationModal(false);
    await storage.setItem("notification_modal_shown", "true");
  };

  const handleSwipeLeft = (job: LegacyJob) => {
    console.log("Rejected:", job.title);
    setCurrentJobIndex((prev) => prev + 1);
  };

  const handleSwipeRight = (job: LegacyJob) => {
    console.log("Applied:", job.title);
    setCurrentJobIndex((prev) => prev + 1);

    // Find the normalized job to get the URL
    const normalizedJob = jobs.find((j) => j.id === job.id);
    if (!normalizedJob) {
      console.warn("Could not find normalized job for:", job.id);
      return;
    }

    // Add to batch queue - will be sent after 2 minutes of inactivity
    addSwipedJob(normalizedJob);
  };

  const handleUndo = () => {
    swipeDeckRef.current?.undo();
    setCurrentJobIndex((prev) => Math.max(0, prev - 1));
  };

  const handleReject = () => {
    swipeDeckRef.current?.swipeLeft();
  };

  const handleAccept = () => {
    swipeDeckRef.current?.swipeRight();
  };

  const handleSelectProfile = async () => {
    if (profilesLoading) {
      Alert.alert("Loading", "Please wait while profiles are loading...");
      return;
    }
    if (profiles.length === 0) {
      Alert.alert(
        "No Profiles Found",
        "Please create a job profile first to enable job automation.",
        [{ text: "OK" }],
      );
      return;
    }

    // If there are pending jobs, flush them before changing settings
    if (batchPendingJobs.length > 0) {
      console.log("Flushing pending jobs before profile change...");
      await flushAndReset();
    }

    setShowProfileSelector(true);
  };

  // Voice auto-pilot handler
  const handleVoiceCommand = () => {
    setShowVoiceOverlay(true);
  };

  // Handle parsed voice command
  const handleVoiceCommandParsed = useCallback(
    (command: ParsedVoiceCommand) => {
      console.log("Voice command parsed:", command);

      // Map parsed params to JobFilters
      const { params, intent } = command;

      if (params) {
        const newFilters: JobFilters = {
          remoteOnly: params.remote || false,
          salaryMin: params.salaryMin ?? 30000,
          salaryMax: params.salaryMax ?? 200000,
          jobTypes: params.jobType || [], // already string[]
          workModes: params.remote ? ["remote"] : [],
          country: params.country || null,
          cities: params.city
            ? [params.city]
            : params.location
              ? [params.location]
              : [],
          experienceLevels: params.experienceLevel
            ? [params.experienceLevel]
            : [],
          visaSponsorship: false,
        };

        // ... existing mapping logic ...
        // We will simplify and trust the service params mapping for now,
        // or rebuild this mapping block.

        // Re-implementing filter application based on new params structure
        const jobTypesMap: Record<string, EmploymentType> = {
          "full-time": "full_time",
          "part-time": "part_time",
          contract: "contract",
          internship: "internship",
          freelance: "freelance",
        };

        const workModesMap: Record<string, WorkplaceType> = {
          remote: "remote",
          hybrid: "hybrid",
          "on-site": "onsite",
          onsite: "onsite",
        };

        // Build query string from job title and skills
        const queryParts: string[] = [];
        if (params.jobTitle) queryParts.push(params.jobTitle);
        if (params.skills) queryParts.push(...params.skills);

        const searchFilters = {
          query: queryParts.length > 0 ? queryParts.join(" ") : undefined,
          remoteOnly: newFilters.remoteOnly,
          salaryMin: newFilters.salaryMin,
          salaryMax: newFilters.salaryMax,
          jobTypes: params.jobType
            ? (params.jobType
                .map((t: string) => jobTypesMap[t.toLowerCase()] || null)
                .filter(Boolean) as EmploymentType[])
            : undefined,
          workModes: params.remote
            ? (["remote"] as WorkplaceType[])
            : undefined,
          countries: params.country ? [params.country] : undefined,
          states: params.state ? [params.state] : undefined,
          cities: newFilters.cities.length > 0 ? newFilters.cities : undefined,
          companies: params.company ? [params.company] : undefined,
          skills: params.skills,
        };

        if (intent === "search" || intent === "filter" || intent === "apply") {
          const result = jobService.searchJobs(searchFilters);
          console.log("Voice filter - found jobs:", result.total);
          setJobs(result.jobs);
          setCurrentJobIndex(0);
          setFilters(newFilters);
        }
      }

      // Handle Auto-Apply / Auto-Swipe
      if (params.applyToAll || intent === "apply") {
        const swipeCount = params.applyToAll ? 20 : 5; // Default to 5 or 20

        setIsAutoPilotActive(true);
        setAutoPilotProgress({ current: 0, total: swipeCount });

        let swiped = 0;
        // ... (existing interval logic) ...
        autoPilotRef.current = setInterval(() => {
          if (swiped >= swipeCount) {
            if (autoPilotRef.current) {
              clearInterval(autoPilotRef.current);
            }
            setIsAutoPilotActive(false);
            return;
          }

          swipeDeckRef.current?.swipeRight(); // Always apply for "apply" intent

          swiped++;
          setAutoPilotProgress({ current: swiped, total: swipeCount });
        }, 800);
      }

      if (intent === "skip") {
        const swipeCount = 5;
        setIsAutoPilotActive(true);
        setAutoPilotProgress({ current: 0, total: swipeCount });
        let swiped = 0;
        autoPilotRef.current = setInterval(() => {
          if (swiped >= swipeCount) {
            if (autoPilotRef.current) clearInterval(autoPilotRef.current);
            setIsAutoPilotActive(false);
            return;
          }
          swipeDeckRef.current?.swipeLeft();
          swiped++;
          setAutoPilotProgress({ current: swiped, total: swipeCount });
        }, 800);
      }
    },
    [jobs.length, currentJobIndex],
  );

  // Stop auto-pilot
  const stopAutoPilot = useCallback(() => {
    if (autoPilotRef.current) {
      clearInterval(autoPilotRef.current);
    }
    setIsAutoPilotActive(false);
  }, []);

  const handleApplyFilters = (newFilters: JobFilters) => {
    setFilters(newFilters);
    console.log("Filters applied:", newFilters);

    // Apply filters to jobs - map JobFilters to JobSearchFilters
    const jobTypesMap: Record<string, EmploymentType> = {
      "full-time": "full_time",
      "part-time": "part_time",
      contract: "contract",
      internship: "internship",
      freelance: "freelance",
    };

    const workModesMap: Record<string, WorkplaceType> = {
      remote: "remote",
      hybrid: "hybrid",
      "on-site": "onsite",
      onsite: "onsite",
    };

    const searchFilters = {
      remoteOnly: newFilters.remoteOnly,
      salaryMin: newFilters.salaryMin,
      salaryMax: newFilters.salaryMax,
      jobTypes:
        newFilters.jobTypes.length > 0
          ? (newFilters.jobTypes
              .map((t) => jobTypesMap[t.toLowerCase()] || null)
              .filter(Boolean) as EmploymentType[])
          : undefined,
      workModes:
        newFilters.workModes.length > 0
          ? (newFilters.workModes
              .map((m) => workModesMap[m.toLowerCase()] || null)
              .filter(Boolean) as WorkplaceType[])
          : undefined,
      countries: newFilters.country ? [newFilters.country] : undefined,
      cities: newFilters.cities.length > 0 ? newFilters.cities : undefined,
    };

    const result = jobService.searchJobs(searchFilters);
    console.log(
      "Filtered jobs:",
      result.total,
      "of",
      jobService.getAllJobs().length,
    );
    setJobs(result.jobs);
    setCurrentJobIndex(0);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header - hide when card is expanded */}
      {!isCardExpanded && (
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Discover
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {jobs.length} jobs available
              {profilesLoading
                ? " • Loading profiles..."
                : profiles.length === 0
                  ? " • No profile"
                  : selectedProfile
                    ? ` • ${selectedProfile.name}`
                    : ""}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={() => setShowFilters(true)}
            >
              <Ionicons
                name="options-outline"
                size={Math.round(22 * uiScale)}
                color={colors.text}
              />
              {filters && (
                <View
                  style={[
                    styles.filterBadge,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Auto-pilot progress indicator - hide when expanded */}
      {isAutoPilotActive && !isCardExpanded && (
        <TouchableOpacity
          style={[
            styles.glassBannerContainer,
            { top: insets.top + spacing[16] },
          ]}
          onPress={stopAutoPilot}
          activeOpacity={0.8}
        >
          <BlurView
            intensity={Platform.OS === "ios" ? 80 : 100}
            tint={colors.background === "#FFFFFF" ? "light" : "dark"}
            style={[
              styles.glassBanner,
              {
                borderColor: colors.border,
                backgroundColor: isDark
                  ? "rgba(30,30,30,0.5)"
                  : "rgba(255,255,255,0.5)",
              },
            ]}
          >
            <View style={styles.bannerContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <MaterialCommunityIcons
                  name="robot-happy-outline"
                  size={Math.round(24 * uiScale)}
                  color={colors.primary}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.bannerTitle, { color: colors.text }]}>
                  Auto-Pilot Active
                </Text>
                <Text
                  style={[
                    styles.bannerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Processing {autoPilotProgress.current} of{" "}
                  {autoPilotProgress.total}
                </Text>
              </View>
              <View style={styles.stopContainer}>
                <Ionicons
                  name="pause-circle"
                  size={Math.round(32 * uiScale)}
                  color={colors.primary}
                />
              </View>
            </View>
            {/* Progress Bar Line */}
            <View
              style={[styles.progressBar, { backgroundColor: colors.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min((autoPilotProgress.current / autoPilotProgress.total) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
          </BlurView>
        </TouchableOpacity>
      )}

      {/* Swipe Deck */}
      <View
        style={[
          styles.deckContainer,
          Platform.OS === "android" && { marginBottom: -10 },
        ]}
      >
        <SwipeDeck
          ref={swipeDeckRef}
          jobs={legacyJobs}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onExpandChange={setIsCardExpanded}
          onSwipingChange={setIsSwiping}
        />
      </View>

      {/* Action Buttons - hide when card is expanded or swiping */}
      {!isCardExpanded && !isSwiping && (
        <View
          style={[
            styles.actionsContainer,
            {
              backgroundColor: colors.surfaceSecondary,
              bottom: actionsBottomOffset,
            },
          ]}
        >
          {/* Undo */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.smallButton,
              { backgroundColor: colors.surface },
            ]}
            onPress={handleUndo}
          >
            <Ionicons
              name="arrow-undo"
              size={Math.round(20 * uiScale)}
              color="#FBC02D"
            />
          </TouchableOpacity>

          {/* Reject */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.largeButton,
              { backgroundColor: colors.surface },
            ]}
            onPress={handleReject}
          >
            <Ionicons
              name="close"
              size={Math.round(30 * uiScale)}
              color="#F72585"
            />
          </TouchableOpacity>

          {/* Voice Auto-Pilot (Center, Largest) */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.xlButton,
              {
                backgroundColor: isAutoPilotActive
                  ? colors.primary
                  : colors.surface,
              },
            ]}
            onPress={isAutoPilotActive ? stopAutoPilot : handleVoiceCommand}
          >
            <MaterialCommunityIcons
              name={isAutoPilotActive ? "pause" : "waveform"}
              size={Math.round(36 * uiScale)}
              color={isAutoPilotActive ? "#FFFFFF" : colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Accept */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.largeButton,
              { backgroundColor: colors.surface },
            ]}
            onPress={handleAccept}
          >
            <Ionicons
              name="heart"
              size={Math.round(30 * uiScale)}
              color="#00C853"
            />
          </TouchableOpacity>

          {/* Select Profile */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.smallButton,
              { backgroundColor: colors.surface },
            ]}
            onPress={handleSelectProfile}
          >
            <Ionicons
              name="person-circle-outline"
              size={Math.round(20 * uiScale)}
              color="#FF9800"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Voice Auto-Pilot Overlay */}
      <VoiceAutoPilotOverlay
        visible={showVoiceOverlay}
        onClose={() => setShowVoiceOverlay(false)}
        onCommandParsed={handleVoiceCommandParsed}
      />

      {/* Modals */}
      <JobFiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        initialFilters={filters || undefined}
      />

      <ProfileSelectorModal
        visible={showProfileSelector}
        onClose={() => setShowProfileSelector(false)}
        onSelect={(selection: ProfileSelection) => {
          const { profile, resumeSettings: newResumeSettings } = selection;
          setSelectedProfileId(profile.id);
          setResumeSettings(newResumeSettings);
          console.log("Selected profile:", profile.name);
          console.log("Resume settings:", newResumeSettings);
        }}
        selectedProfileId={selectedProfileId || undefined}
        profiles={modalProfiles}
        initialResumeSettings={resumeSettings}
      />

      {/* Notification Permission Modal */}
      <NotificationPermissionModal
        visible={showNotificationModal}
        onEnable={handleEnableNotifications}
        onSkip={handleSkipNotifications}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSize["3xl"],
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  filterButton: {
    width: Math.round(44 * uiScale),
    height: Math.round(44 * uiScale),
    borderRadius: Math.round(22 * uiScale),
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  autoPilotBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    marginHorizontal: spacing[6],
    borderRadius: 12,
    gap: 8,
  },
  autoPilotText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: Math.round(14 * uiScale),
  },
  autoPilotStop: {
    color: "rgba(255,255,255,0.7)",
    fontSize: Math.round(12 * uiScale),
    marginLeft: 8,
  },
  deckContainer: {
    flex: 1,
    zIndex: 1,
    marginVertical: spacing[2],
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "85%",
    alignSelf: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    position: "absolute",
    zIndex: 100,
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  smallButton: {
    width: Math.round(40 * uiScale),
    height: Math.round(40 * uiScale),
    borderRadius: Math.round(20 * uiScale),
  },
  largeButton: {
    width: Math.round(54 * uiScale),
    height: Math.round(54 * uiScale),
    borderRadius: Math.round(27 * uiScale),
  },
  xlButton: {
    width: Math.round(66 * uiScale),
    height: Math.round(66 * uiScale),
    borderRadius: Math.round(33 * uiScale),
  },
  glassBannerContainer: {
    position: "absolute",
    left: spacing[4],
    right: spacing[4],
    zIndex: 200,
    alignItems: "center",
  },
  glassBanner: {
    borderRadius: 20,
    overflow: "hidden",
    width: "100%",
    borderWidth: 1,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    gap: spacing[3],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
  },
  stopContainer: {
    alignItems: "center",
    gap: 4,
  },
  stopText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  progressBar: {
    height: 2,
    width: "100%",
  },
  progressFill: {
    height: "100%",
  },
});
