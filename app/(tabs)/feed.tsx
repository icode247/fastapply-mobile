import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as NavigationBar from "expo-navigation-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  JobFilters,
  JobFiltersModal,
} from "../../src/components/feed/JobFiltersModal";
import { ProfileSelectorModal } from "../../src/components/feed/ProfileSelectorModal";
import { SwipeDeck, SwipeDeckRef } from "../../src/components/feed/SwipeDeck";
import { VoiceActivityIcon } from "../../src/components/feed/VoiceActivityIcon";
import { VoiceCommandOverlay } from "../../src/components/feed/VoiceCommandOverlay";
import { spacing, typography } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { useAutomation } from "../../src/hooks/useAutomation";
import { useVoiceCommand } from "../../src/hooks/useVoiceCommand";
import { automationService } from "../../src/services/automation.service";
import { jobService } from "../../src/services/job.service";
import { profileService } from "../../src/services/profile.service";
import { EmploymentType, NormalizedJob, WorkplaceType } from "../../src/types/job.types";
import { JobProfile } from "../../src/types/profile.types";

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
  const hasBasicInfo = !!(profile.firstName && profile.lastName && profile.email);
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

  // Load jobs from service
  const [jobs, setJobs] = useState<NormalizedJob[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);

  // Set Android navigation bar color to match theme
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(colors.background);
      NavigationBar.setButtonStyleAsync(
        colors.background === "#FFFFFF" || colors.background.toLowerCase() === "#fff"
          ? "dark"
          : "light"
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
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Fetch profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setProfilesLoading(true);
        const fetchedProfiles = await profileService.getProfiles();
        setProfiles(fetchedProfiles);

        // Select primary profile by default, or first profile
        const primaryProfile = fetchedProfiles.find(p => p.isPrimary);
        if (primaryProfile) {
          setSelectedProfileId(primaryProfile.id);
        } else if (fetchedProfiles.length > 0) {
          setSelectedProfileId(fetchedProfiles[0].id);
        }

        console.log("Loaded profiles:", fetchedProfiles.length);

        // Clean up any cached data for profiles that no longer exist
        const validProfileIds = fetchedProfiles.map(p => p.id);
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
    [profiles, selectedProfileId]
  );

  // Convert profiles to modal format
  const modalProfiles = useMemo(
    () => profiles.map(toProfile),
    [profiles]
  );

  // Convert jobs to legacy format for SwipeDeck
  const legacyJobs = useMemo(() => jobs.map(toLegacyJob), [jobs]);

  // Automation hook - queues jobs on swipe right
  const {
    isReady: automationReady,
    isProcessing: automationProcessing,
    queueJob,
    queueStats,
    pendingCount,
    lastError: automationError,
    clearError: clearAutomationError,
  } = useAutomation({
    profileId: selectedProfileId,
    profileName: selectedProfile?.name,
    onSuccess: (job, automationId) => {
      console.log(`Job queued successfully: ${job.title} -> automation ${automationId}`);
    },
    onError: (job, error) => {
      console.error(`Failed to queue job: ${job.title}`, error);
    },
  });

  // Helper to find NormalizedJob from LegacyJob id
  const getJobById = useCallback(
    (id: string): NormalizedJob | undefined => {
      return jobs.find((j) => j.id === id);
    },
    [jobs]
  );

  // Voice command hook
  const {
    isListening,
    isProcessing,
    lastCommand,
    error: voiceError,
    isConfigured: voiceConfigured,
    startListening,
    stopListening,
    cancelListening,
  } = useVoiceCommand({
    jobs,
    currentJobIndex,
    profile: selectedProfile || null,
    onApply: () => {
      swipeDeckRef.current?.swipeRight();
    },
    onSkip: () => {
      swipeDeckRef.current?.swipeLeft();
    },
    onUndo: () => {
      swipeDeckRef.current?.undo();
    },
    onNext: () => {
      swipeDeckRef.current?.swipeLeft();
    },
    onSearch: (filteredJobs) => {
      // Update jobs with search results
      console.log("Search returned", filteredJobs.length, "jobs");
    },
    onFilter: (filteredJobs) => {
      // Update jobs with filtered results
      console.log("Filter returned", filteredJobs.length, "jobs");
    },
    onError: (error) => {
      console.error("Voice command error:", error);
    },
    hapticFeedback: true,
  });

  // Load jobs on mount
  useEffect(() => {
    const allJobs = jobService.getAllJobs();
    setJobs(allJobs);

    // Log stats
    const stats = jobService.getStats();
    console.log("Loaded jobs:", stats);
  }, []);

  const handleSwipeLeft = (job: LegacyJob) => {
    console.log("Rejected:", job.title);
    setCurrentJobIndex((prev) => prev + 1);
  };

  const handleSwipeRight = async (job: LegacyJob) => {
    console.log("Applied:", job.title);
    setCurrentJobIndex((prev) => prev + 1);

    // Check if profiles are loaded and selected
    if (profilesLoading) {
      return;
    }

    if (!selectedProfileId || profiles.length === 0) {
      return;
    }

    // Find the full normalized job to get the URL
    const normalizedJob = getJobById(job.id);

    if (!normalizedJob) {
      console.error("Could not find job details for:", job.id);
      return;
    }

    // Queue job to automation service silently
    await queueJob(normalizedJob);

    // Clear any errors silently
    if (automationError) {
      clearAutomationError();
    }
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
        [{ text: "OK" }]
      );
      return;
    }
    setShowProfileSelector(true);
  };

  // Voice command handler
  const handleVoiceCommand = async () => {
    if (!voiceConfigured) {
      Alert.alert(
        "Voice Commands Not Configured",
        "Please add your OpenAI API key to enable voice commands.\n\n" +
        "Add EXPO_PUBLIC_OPENAI_API_KEY to your environment variables.",
        [{ text: "OK" }]
      );
      return;
    }

    if (isListening) {
      // Stop listening and process
      setShowVoiceOverlay(false);
      await stopListening();
    } else {
      // Start listening
      setShowVoiceOverlay(true);
      const started = await startListening();
      if (!started) {
        setShowVoiceOverlay(false);
        Alert.alert(
          "Microphone Access Required",
          "Please allow microphone access to use voice commands.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const handleCloseVoiceOverlay = async () => {
    if (isListening) {
      await cancelListening();
    }
    setShowVoiceOverlay(false);
  };

  const handleStopListening = async () => {
    await stopListening();
    // Keep overlay open briefly to show result
    setTimeout(() => {
      setShowVoiceOverlay(false);
    }, 1500);
  };

  const handleApplyFilters = (newFilters: JobFilters) => {
    setFilters(newFilters);
    console.log("Filters applied:", newFilters);

    // Apply filters to jobs - map JobFilters to JobSearchFilters
    const jobTypesMap: Record<string, EmploymentType> = {
      "full-time": "full_time",
      "part-time": "part_time",
      "contract": "contract",
      "internship": "internship",
      "freelance": "freelance",
    };

    const workModesMap: Record<string, WorkplaceType> = {
      "remote": "remote",
      "hybrid": "hybrid",
      "on-site": "onsite",
      "onsite": "onsite",
    };

    const searchFilters = {
      remoteOnly: newFilters.remoteOnly,
      salaryMin: newFilters.salaryMin,
      salaryMax: newFilters.salaryMax,
      jobTypes: newFilters.jobTypes.length > 0
        ? newFilters.jobTypes.map(t => jobTypesMap[t.toLowerCase()] || null).filter(Boolean) as EmploymentType[]
        : undefined,
      workModes: newFilters.workModes.length > 0
        ? newFilters.workModes.map(m => workModesMap[m.toLowerCase()] || null).filter(Boolean) as WorkplaceType[]
        : undefined,
      countries: newFilters.country ? [newFilters.country] : undefined,
      cities: newFilters.cities.length > 0 ? newFilters.cities : undefined,
    };

    const result = jobService.searchJobs(searchFilters);
    console.log("Filtered jobs:", result.total, "of", jobService.getAllJobs().length);
    setJobs(result.jobs);
    setCurrentJobIndex(0);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Discover
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {jobs.length} jobs available
            {profilesLoading ? " • Loading profiles..." :
              profiles.length === 0 ? " • No profile" :
              selectedProfile ? ` • ${selectedProfile.name}` : ""}
            {queueStats && queueStats.pending > 0 && (
              ` • ${queueStats.pending} queued`
            )}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {/* Queue indicator */}
          {(automationProcessing || pendingCount > 0) && (
            <View
              style={[
                styles.queueIndicator,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <MaterialCommunityIcons
                name="sync"
                size={18}
                color={colors.primary}
              />
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: colors.surfaceSecondary },
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={22} color={colors.text} />
            {filters && (
              <View
                style={[styles.filterBadge, { backgroundColor: colors.primary }]}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Swipe Deck */}
      <View style={styles.deckContainer}>
        <SwipeDeck
          ref={swipeDeckRef}
          jobs={legacyJobs}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
      </View>

      {/* Action Buttons */}
      <View
        style={[
          styles.actionsContainer,
          {
            backgroundColor: colors.surfaceSecondary,
            bottom: insets.bottom - 10,
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
          <Ionicons name="arrow-undo" size={22} color="#FBC02D" />
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
          <Ionicons name="close" size={36} color="#F72585" />
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
          <Ionicons name="person-circle-outline" size={22} color="#FF9800" />
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
          <Ionicons name="heart" size={36} color="#00C853" />
        </TouchableOpacity>

        {/* Voice Command */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.smallButton,
            {
              backgroundColor: isListening ? colors.primary : colors.surface,
            },
          ]}
          onPress={handleVoiceCommand}
        >
          {isListening || isProcessing ? (
            <VoiceActivityIcon
              color={isListening ? "#FFFFFF" : colors.primary}
            />
          ) : (
            <MaterialCommunityIcons
              name="waveform"
              size={24}
              color={voiceConfigured ? colors.text : colors.textTertiary}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Voice Command Overlay */}
      <VoiceCommandOverlay
        visible={showVoiceOverlay}
        isListening={isListening}
        isProcessing={isProcessing}
        suggestion={lastCommand?.suggestion}
        onClose={handleCloseVoiceOverlay}
        onStopListening={handleStopListening}
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
  queueIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
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
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  largeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});
