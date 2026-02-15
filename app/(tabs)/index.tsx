import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as NavigationBar from "expo-navigation-bar";
import { useRouter } from "expo-router";
import { Gift, MonitorPlay, SlidersHorizontal, Zap } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../src/components/ui/Text";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
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
import { RewardsModal } from "../../src/components/feed/RewardsModal";
import { StatsModal } from "../../src/components/feed/StatsModal";
import { SwipeDeck, SwipeDeckRef } from "../../src/components/feed/SwipeDeck";
// import { VoiceAutoPilotOverlay } from "../../src/components/feed/VoiceAutoPilotOverlay";
import { LoadingScreen } from "../../src/components/shared/LoadingScreen";
import { spacing, typography, uiScale } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { useAutomation } from "../../src/hooks/useAutomation";
import { useSwipeBatchQueue } from "../../src/hooks/useSwipeBatchQueue";
import { automationService } from "../../src/services/automation.service";
import { notificationService } from "../../src/services/notification.service";
import { subscriptionService } from "../../src/services/subscription.service";
import { storage } from "../../src/utils/storage";
import { jobService, JobPreferences } from "../../src/services/job.service";
import { ensureCacheLoaded, getAllCachedJobs } from "../../src/services/swipedJobsCache.service";
import { profileService } from "../../src/services/profile.service";
import { usePreferencesStore } from "../../src/stores/preferences.store";
import { useScout } from "../../src/hooks/useScout";
import { useScoutStore } from "../../src/stores/scout.store";
import {
  EmploymentType,
  NormalizedJob,
  WorkplaceType,
} from "../../src/types/job.types";
import { JobProfile } from "../../src/types/profile.types";
import { ParsedVoiceCommand } from "../../src/types/voice.types";

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

// Map UI job type strings to API employment types
const JOB_TYPE_MAP: Record<string, EmploymentType> = {
  "full-time": "full_time",
  "part-time": "part_time",
  "contract": "contract",
  "freelance": "freelance",
  "internship": "internship",
};

// Map UI work mode strings to API workplace types
const WORK_MODE_MAP: Record<string, WorkplaceType> = {
  "remote": "remote",
  "hybrid": "hybrid",
  "on-site": "onsite",
  "onsite": "onsite",
};

// Map UI experience level strings to API experience levels
const EXPERIENCE_MAP: Record<string, "entry" | "mid" | "senior" | "lead" | "executive"> = {
  "Entry Level": "entry",
  "Junior": "entry",
  "Mid Level": "mid",
  "Senior": "senior",
  "Lead": "lead",
  "Manager": "lead",
  "Executive": "executive",
};

// Convert stored JobPreferencesFormValues to API JobPreferences format
function buildApiPreferences(
  stored: import("../../src/components/feed/JobPreferencesForm").JobPreferencesFormValues,
  profile?: JobProfile,
): JobPreferences | undefined {
  const jobPrefs: JobPreferences = {};

  // Keywords from stored job titles, fallback to profile headline/experience
  if (stored.jobTitles.length > 0) {
    jobPrefs.keywords = stored.jobTitles;
  } else if (profile?.headline) {
    jobPrefs.keywords = [profile.headline];
  } else if (profile?.experience && profile.experience.length > 0) {
    jobPrefs.keywords = [profile.experience[0].title];
  }

  // Locations
  if (stored.locations.length > 0) {
    jobPrefs.locations = stored.locations.map((l) => l.name);
  }

  // Job types
  if (stored.jobTypes.length > 0) {
    jobPrefs.jobTypes = stored.jobTypes
      .map((t) => JOB_TYPE_MAP[t.toLowerCase()])
      .filter((t): t is EmploymentType => t !== undefined);
  }

  // Work modes
  if (stored.remoteOnly) {
    jobPrefs.workModes = ["remote"];
  } else if (stored.workModes.length > 0) {
    jobPrefs.workModes = stored.workModes
      .map((m) => WORK_MODE_MAP[m.toLowerCase()])
      .filter((m): m is WorkplaceType => m !== undefined);
  }

  // Experience levels
  if (stored.experienceLevels.length > 0) {
    jobPrefs.experienceLevels = stored.experienceLevels
      .map((e) => EXPERIENCE_MAP[e])
      .filter((e): e is "entry" | "mid" | "senior" | "lead" | "executive" => e !== undefined);
  }

  const hasPrefs = Object.keys(jobPrefs).length > 0;
  return hasPrefs ? jobPrefs : undefined;
}

export default function FeedScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const swipeDeckRef = useRef<SwipeDeckRef>(null);

  // Persistent job preferences (shared between onboarding and filter modal)
  const {
    preferences: storedPreferences,
    isLoaded: prefsLoaded,
    initialize: initPreferences,
    setPreferences: savePreferences,
  } = usePreferencesStore();

  // Scout voice assistant - consume pending actions
  const { pendingAction, clearPendingAction } = useScoutStore();

  // Initialize preferences store on mount
  useEffect(() => {
    initPreferences();
  }, []);

  // Actions container bottom offset
  const actionsBottomOffset = Platform.OS === "ios" ? insets.bottom - 23 : 12;

  // Load jobs from service
  const [jobs, setJobs] = useState<NormalizedJob[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  // Credits state
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  // Auto-pilot state
  const [isAutoPilotActive, setIsAutoPilotActive] = useState(false);
  const [autoPilotProgress, setAutoPilotProgress] = useState({
    current: 0,
    total: 0,
  });
  const autoPilotRef = useRef<number | null>(null);

  // Live session pulse animation
  const livePulse = useSharedValue(1);

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

  // Fetch credits on mount
  useEffect(() => {
    const loadCredits = async () => {
      try {
        const usage = await subscriptionService.getUsageStats();
        setCreditsRemaining(usage.creditsRemaining);
      } catch (error) {
        console.error("Failed to load credits:", error);
      }
    };
    loadCredits();
  }, []);

  // Modal states
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  // const [showVoiceOverlay, setShowVoiceOverlay] = useState(false); // replaced by Scout
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showStats, setShowStats] = useState(false);

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

  // Determine if automation is actively processing
  const isAutomationLive = !!(queueStats?.processing && queueStats.processing > 0);

  // Live pulse animation when automation is processing
  const livePulseStyle = useAnimatedStyle(() => ({
    opacity: livePulse.value,
  }));

  useEffect(() => {
    if (isAutomationLive) {
      livePulse.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        true,
      );
    } else {
      livePulse.value = withTiming(1, { duration: 300 });
    }
  }, [isAutomationLive]);

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

  // Subscribe to job service updates (for prefetch results)
  useEffect(() => {
    const unsubscribe = jobService.subscribe(() => {
      // Update jobs when service state changes (e.g., after prefetch)
      const allJobs = jobService.getAllJobs();
      setJobs(allJobs);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load swiped jobs cache on mount so liked jobs are filtered from results
  useEffect(() => {
    const loadSwipedCache = async () => {
      await ensureCacheLoaded();
      const cached = await getAllCachedJobs();
      jobService.setSwipedUrls(new Set(Object.keys(cached)));
    };
    loadSwipedCache();
  }, []);

  // Load jobs from API once preferences and profiles are ready
  useEffect(() => {
    if (!prefsLoaded || profilesLoading) return;

    const loadJobs = async () => {
      setIsLoadingJobs(true);
      try {
        const preferences = buildApiPreferences(storedPreferences, selectedProfile);
        console.log("Loading jobs with preferences:", preferences);

        const fetchedJobs = await jobService.fetchInitialJobs(preferences);
        setJobs(fetchedJobs);
        console.log("Loaded jobs from API:", fetchedJobs.length);
      } catch (error) {
        console.error("Failed to load jobs:", error);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    loadJobs();
  }, [prefsLoaded, profilesLoading, selectedProfile]);

  // Trigger prefetch when approaching the end of jobs
  // The service handles all the logic - we just need to tell it the current index
  useEffect(() => {
    jobService.prefetchIfNeeded(currentJobIndex);
  }, [currentJobIndex]);

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

  // Scout: consume pending actions from voice assistant
  useEffect(() => {
    if (!pendingAction) return;

    const { type, params, navigation } = pendingAction;
    clearPendingAction();

    // Navigate if needed
    if (type === "navigate" && navigation) {
      router.push(navigation as any);
      return;
    }

    // Build search filters from Scout params
    if (type === "search" || type === "filter") {
      const voiceLocations: Array<{ id: string; name: string }> = [];
      if (params.city) {
        voiceLocations.push({ id: params.city.toLowerCase().replace(/\s/g, "-"), name: params.city });
      } else if (params.location) {
        voiceLocations.push({ id: params.location.toLowerCase().replace(/\s/g, "-"), name: params.location });
      }

      const queryParts: string[] = [];
      if (params.jobTitle) queryParts.push(params.jobTitle);
      if (params.skills) queryParts.push(...params.skills);

      const searchFilters = {
        query: queryParts.length > 0 ? queryParts.join(" ") : undefined,
        jobTitles: params.jobTitle ? [params.jobTitle] : undefined,
        remoteOnly: params.remote,
        salaryMin: params.salaryMin,
        salaryMax: params.salaryMax,
        locations: voiceLocations.length > 0 ? voiceLocations.map((l) => l.name) : undefined,
        countries: params.country ? [params.country] : undefined,
        skills: params.skills,
      };

      const result = jobService.searchJobs(searchFilters);
      setJobs(result.jobs);
      setCurrentJobIndex(0);
    }

    // Apply to current job
    if (type === "apply") {
      swipeDeckRef.current?.swipeRight();
    }

    // Skip current job
    if (type === "skip") {
      swipeDeckRef.current?.swipeLeft();
    }

    // Undo
    if (type === "undo") {
      const didUndo = swipeDeckRef.current?.undo();
      if (didUndo) {
        setCurrentJobIndex((prev) => Math.max(0, prev - 1));
      }
    }
  }, [pendingAction]);

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
    const didUndo = swipeDeckRef.current?.undo();
    if (didUndo) {
      setCurrentJobIndex((prev) => Math.max(0, prev - 1));
    }
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

  // Scout voice assistant
  const { activate: activateScout } = useScout();

  // Voice auto-pilot handler — now activates Scout
  const handleVoiceCommand = () => {
    activateScout();
  };

  // Handle parsed voice command
  const handleVoiceCommandParsed = useCallback(
    (command: ParsedVoiceCommand) => {
      console.log("Voice command parsed:", command);

      // Map parsed params to JobFilters
      const { params, intent } = command;

      if (params) {
        // Build locations array from voice params
        const voiceLocations: Array<{ id: string; name: string }> = [];
        if (params.city) {
          voiceLocations.push({
            id: params.city.toLowerCase().replace(/\s/g, "-"),
            name: params.city,
          });
        } else if (params.location) {
          voiceLocations.push({
            id: params.location.toLowerCase().replace(/\s/g, "-"),
            name: params.location,
          });
        }

        const newFilters: JobFilters = {
          jobTitles: params.jobTitle ? [params.jobTitle] : [],
          locations: voiceLocations,
          remoteOnly: params.remote || false,
          salaryMin: params.salaryMin ?? 30000,
          salaryMax: params.salaryMax ?? 200000,
          jobTypes: params.jobType || [],
          workModes: params.remote ? ["remote"] : [],
          experienceLevels: params.experienceLevel
            ? [params.experienceLevel]
            : [],
          visaSponsorship: false,
        };

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
          jobTitles: params.jobTitle ? [params.jobTitle] : undefined,
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
          locations: voiceLocations.length > 0
            ? voiceLocations.map((l) => l.name)
            : undefined,
          countries: params.country ? [params.country] : undefined,
          states: params.state ? [params.state] : undefined,
          companies: params.company ? [params.company] : undefined,
          skills: params.skills,
        };

        if (intent === "search" || intent === "filter" || intent === "apply") {
          const result = jobService.searchJobs(searchFilters);
          console.log("Voice filter - found jobs:", result.total);
          setJobs(result.jobs);
          setCurrentJobIndex(0);
          savePreferences(newFilters);

          // If intent is apply, auto-apply to ALL filtered jobs
          if (intent === "apply" && result.jobs.length > 0) {
            const swipeCount = result.jobs.length;

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

              swipeDeckRef.current?.swipeRight();
              swiped++;
              setAutoPilotProgress({ current: swiped, total: swipeCount });
            }, 800);
          }
        }
      }

      // Handle Auto-Apply when no filters (applyToAll without search)
      if (params.applyToAll && intent !== "apply") {
        const remainingJobs = jobs.length - currentJobIndex;
        const swipeCount = remainingJobs > 0 ? remainingJobs : 0;

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

            swipeDeckRef.current?.swipeRight();
            swiped++;
            setAutoPilotProgress({ current: swiped, total: swipeCount });
          }, 800);
        }
      }

      if (intent === "skip") {
        const remainingJobs = jobs.length - currentJobIndex;
        const swipeCount = remainingJobs > 0 ? remainingJobs : 0;

        if (swipeCount > 0) {
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

  const handleApplyFilters = async (newFilters: JobFilters) => {
    // Persist preferences so they survive app restarts
    await savePreferences(newFilters);
    console.log("Filters applied and saved:", newFilters);

    // Always re-fetch from API with the new preferences
    setIsLoadingJobs(true);
    try {
      const preferences = buildApiPreferences(newFilters, selectedProfile);
      const fetchedJobs = await jobService.fetchInitialJobs(preferences);
      console.log("Fetched jobs from API with filters:", fetchedJobs.length);
      setJobs(fetchedJobs);
      setCurrentJobIndex(0);
    } catch (error) {
      console.error("Failed to fetch jobs with filters:", error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Show loading screen on initial load
  if (isLoadingJobs && jobs.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header - hide when card is expanded */}
      {!isCardExpanded && (
        <View style={styles.header}>
          {/* Left icons: TV (sessions) + Usage */}
          <View style={styles.headerSide}>
            {/* Live Session - TV icon */}
            <Pressable
              style={[
                styles.headerIconButton,
                              ]}
              onPress={() => router.push("/live-sessions" as any)}
            >
              <Animated.View style={isAutomationLive ? livePulseStyle : undefined}>
                <MonitorPlay
                  size={Math.round(26 * uiScale)}
                  color={isAutomationLive ? "#10B981" : "#009688"}
                  strokeWidth={1.8}
                />
              </Animated.View>
              {isAutomationLive && queueStats?.processing ? (
                <View style={[styles.headerBadge, { backgroundColor: "#10B981" }]}>
                  <Text style={styles.headerBadgeText}>{queueStats.processing}</Text>
                </View>
              ) : null}
            </Pressable>

            {/* Usage */}
            <Pressable
              style={[
                styles.headerIconButton,
                              ]}
              onPress={() => setShowStats(true)}
            >
              <Zap
                size={Math.round(26 * uiScale)}
                color={colors.textTertiary}
                strokeWidth={1.8}
              />
            </Pressable>
          </View>

          {/* Center: Logo */}
          <Image
            source={require("../../assets/full-logo-cropped.png")}
            style={[
              styles.brandLogo,
              { tintColor: isDark ? "#FFFFFF" : colors.text },
            ]}
            resizeMode="contain"
          />

          {/* Right icons: Gift (credits) + Filter */}
          <View style={styles.headerSide}>
            {/* Credits - Gift icon */}
            <Pressable
              style={[
                styles.headerIconButton,
                              ]}
              onPress={() => setShowRewards(true)}
            >
              <Gift
                size={Math.round(26 * uiScale)}
                color="#9C27B0"
                strokeWidth={1.8}
              />
            </Pressable>

            {/* Filter */}
            <Pressable
              style={[
                styles.headerIconButton,
                              ]}
              onPress={() => setShowFilters(true)}
            >
              <SlidersHorizontal
                size={Math.round(26 * uiScale)}
                color={colors.textTertiary}
                strokeWidth={1.8}
              />
              {(storedPreferences.jobTitles.length > 0 || storedPreferences.locations.length > 0) && (
                <View
                  style={[
                    styles.filterBadge,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </Pressable>
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
                backgroundColor: Platform.OS === "android"
                  ? (isDark ? "rgba(30,30,30,0.92)" : "rgba(255,255,255,0.95)")
                  : (isDark ? "rgba(30,30,30,0.5)" : "rgba(255,255,255,0.5)"),
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
          Platform.OS === "android" && { marginBottom: 0 },
        ]}
      >
        <SwipeDeck
          ref={swipeDeckRef}
          jobs={legacyJobs as any}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onExpandChange={setIsCardExpanded}
          onSwipingChange={setIsSwiping}
          isFetchingMore={jobService.isPrefetchingJobs()}
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
              size={Math.round(26 * uiScale)}
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
              size={Math.round(26 * uiScale)}
              color="#FF9800"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Voice Auto-Pilot Overlay — replaced by Scout (global in _layout.tsx) */}
      {/* <VoiceAutoPilotOverlay
        visible={showVoiceOverlay}
        onClose={() => setShowVoiceOverlay(false)}
        onCommandParsed={handleVoiceCommandParsed}
      /> */}

      {/* Modals */}
      <JobFiltersModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        initialFilters={storedPreferences}
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

      {/* Rewards & Referral Modal */}
      <RewardsModal
        visible={showRewards}
        onClose={() => setShowRewards(false)}
      />

      {/* Stats Modal */}
      <StatsModal
        visible={showStats}
        onClose={() => setShowStats(false)}
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
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
  },
  brandLogo: {
    height: 28,
    width: 105,
  },
  headerSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  headerIconButton: {
    width: Math.round(34 * uiScale),
    height: Math.round(34 * uiScale),
    justifyContent: "center",
    alignItems: "center",
  },
  headerBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  filterBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
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
