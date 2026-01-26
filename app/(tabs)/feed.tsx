import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
import { ProfileSelectorModal } from "../../src/components/feed/ProfileSelectorModal";
import { SwipeDeck, SwipeDeckRef } from "../../src/components/feed/SwipeDeck";
import {
  ParsedVoiceCommand,
  VoiceAutoPilotOverlay,
} from "../../src/components/feed/VoiceAutoPilotOverlay";
import { spacing, typography } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { useAutomation } from "../../src/hooks/useAutomation";
import { automationService } from "../../src/services/automation.service";
import { jobService } from "../../src/services/job.service";
import { profileService } from "../../src/services/profile.service";
import {
  EmploymentType,
  NormalizedJob,
  WorkplaceType,
} from "../../src/types/job.types";
import { JobProfile } from "../../src/types/profile.types";

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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const swipeDeckRef = useRef<SwipeDeckRef>(null);

  // Actions container bottom offset
  const actionsBottomOffset = Platform.OS === "ios" ? insets.bottom - 10 : 16;

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
  const [filters, setFilters] = useState<JobFilters | null>(null);

  // Real profiles from backend
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );

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

  const handleSwipeLeft = (job: LegacyJob) => {
    console.log("Rejected:", job.title);
    setCurrentJobIndex((prev) => prev + 1);
  };

  const handleSwipeRight = (job: LegacyJob) => {
    console.log("Applied:", job.title);
    // setCurrentJobIndex((prev) => prev + 1);

    // TODO: Queue code commented out for testing
    // // Queue job directly to automation service - completely bypass React state
    // // This ensures swiping is never blocked by the queue operation
    // const profileId = selectedProfileId;
    // const profileName = selectedProfile?.name;
    // const normalizedJob = jobs.find((j) => j.id === job.id);

    // if (!profileId || !normalizedJob) {
    //   return;
    // }

    // const jobUrl = normalizedJob.applyUrl || normalizedJob.listingUrl;
    // if (!jobUrl) {
    //   return;
    // }

    // // Fire and forget - call service directly without any React state updates
    // automationService.addJobToQueue(
    //   profileId,
    //   jobUrl,
    //   {
    //     title: normalizedJob.title,
    //     company: normalizedJob.company,
    //     platform: normalizedJob.source,
    //   },
    //   profileName
    // ).then((result) => {
    //   if (result.success) {
    //     console.log("Job queued:", normalizedJob.title);
    //   }
    // }).catch((err) => {
    //   console.error("Failed to queue job:", err);
    // });
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

  const handleSelectProfile = () => {
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

      // Apply filters from voice command
      if (command.filters) {
        const newFilters: JobFilters = {
          remoteOnly: command.filters.remote || false,
          salaryMin: command.filters.minSalary ?? 30000,
          salaryMax: 200000,
          jobTypes: command.filters.jobTypes || [],
          workModes: command.filters.remote ? ["remote"] : [],
          country: null,
          cities: command.filters.locations || [],
          experienceLevels: [],
          visaSponsorship: false,
        };

        // Apply filters to job service
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
          cities: newFilters.cities.length > 0 ? newFilters.cities : undefined,
          keywords: command.filters.keywords,
        };

        const result = jobService.searchJobs(searchFilters);
        console.log("Voice filter - found jobs:", result.total);
        setJobs(result.jobs);
        setCurrentJobIndex(0);
        setFilters(newFilters);
      }

      // Start auto-swipe if requested
      if (command.autoSwipe) {
        const { direction, count } = command.autoSwipe;
        const swipeCount =
          count === "all"
            ? Math.min(jobs.length - currentJobIndex, 20)
            : Math.min(count, jobs.length - currentJobIndex);

        if (swipeCount > 0) {
          setIsAutoPilotActive(true);
          setAutoPilotProgress({ current: 0, total: swipeCount });

          let swiped = 0;
          autoPilotRef.current = setInterval(() => {
            if (swiped >= swipeCount) {
              if (autoPilotRef.current) {
                clearInterval(autoPilotRef.current);
              }
              setIsAutoPilotActive(false);
              return;
            }

            if (direction === "right") {
              swipeDeckRef.current?.swipeRight();
            } else {
              swipeDeckRef.current?.swipeLeft();
            }

            swiped++;
            setAutoPilotProgress({ current: swiped, total: swipeCount });
          }, 800); // Swipe every 800ms
        }
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
              {queueStats &&
                queueStats.pending > 0 &&
                ` • ${queueStats.pending} queued`}
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
          style={[styles.autoPilotBanner, { backgroundColor: colors.primary }]}
          onPress={stopAutoPilot}
        >
          <MaterialCommunityIcons
            name="robot"
            size={Math.round(20 * uiScale)}
            color="#FFFFFF"
          />
          <Text style={styles.autoPilotText}>
            Auto-pilot: {autoPilotProgress.current}/{autoPilotProgress.total}
          </Text>
          <Text style={styles.autoPilotStop}>Tap to stop</Text>
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
              size={Math.round(22 * uiScale)}
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
              size={Math.round(36 * uiScale)}
              color="#F72585"
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
              size={Math.round(22 * uiScale)}
              color="#FF9800"
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
              size={Math.round(36 * uiScale)}
              color="#00C853"
            />
          </TouchableOpacity>

          {/* Voice Auto-Pilot */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.smallButton,
              {
                backgroundColor: isAutoPilotActive
                  ? colors.primary
                  : colors.surface,
              },
            ]}
            onPress={isAutoPilotActive ? stopAutoPilot : handleVoiceCommand}
          >
            <MaterialCommunityIcons
              name={isAutoPilotActive ? "stop" : "waveform"}
              size={Math.round(24 * uiScale)}
              color={isAutoPilotActive ? "#FFFFFF" : colors.textSecondary}
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
        onSelect={(profile) => {
          setSelectedProfileId(profile.id);
          console.log("Selected profile:", profile.name);
        }}
        selectedProfileId={selectedProfileId || undefined}
        profiles={modalProfiles}
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
    paddingVertical: spacing[3],
    position: "absolute",
    // bottom is set dynamically with safe area insets
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
    width: Math.round(44 * uiScale),
    height: Math.round(44 * uiScale),
    borderRadius: Math.round(22 * uiScale),
  },
  largeButton: {
    width: Math.round(60 * uiScale),
    height: Math.round(60 * uiScale),
    borderRadius: Math.round(30 * uiScale),
  },
});
