import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  JobFilters,
  JobFiltersModal,
} from "../../src/components/feed/JobFiltersModal";
import {
  MOCK_PROFILES,
  ProfileSelectorModal,
} from "../../src/components/feed/ProfileSelectorModal";
import { SwipeDeck, SwipeDeckRef } from "../../src/components/feed/SwipeDeck";
import { VoiceActivityIcon } from "../../src/components/feed/VoiceActivityIcon";
import { spacing, typography } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { Job, MOCK_JOBS } from "../../src/mocks/jobs";

export default function FeedScreen() {
  const { colors } = useTheme();
  const swipeDeckRef = useRef<SwipeDeckRef>(null);

  // Modal states
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [filters, setFilters] = useState<JobFilters | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState(
    MOCK_PROFILES[0]?.id
  );

  const handleSwipeLeft = (job: Job) => {
    console.log("Rejected:", job.title);
    // TODO: Connect to applicationService.rejectJob(job.id)
  };

  const handleSwipeRight = (job: Job) => {
    console.log("Applied:", job.title);
    // TODO: Connect to applicationService.applyToJob(job.id)
    Alert.alert("Application Sent! 🎉", `You applied to ${job.company}`);
  };

  const handleUndo = () => {
    swipeDeckRef.current?.undo();
  };

  const handleReject = () => {
    swipeDeckRef.current?.swipeLeft();
  };

  const handleAccept = () => {
    swipeDeckRef.current?.swipeRight();
  };

  const handleSelectProfile = () => {
    setShowProfileSelector(true);
  };

  // Voice command state
  const [isListening, setIsListening] = useState(false);

  const handleVoiceCommand = () => {
    setIsListening(!isListening);
    // TODO: Implement actual voice command logic
    if (!isListening) {
      // Simulate listening start
      Alert.alert("Listening...", "Try saying 'Apply to this job'");
    }
  };

  const handleApplyFilters = (newFilters: JobFilters) => {
    setFilters(newFilters);
    console.log("Filters applied:", newFilters);
    // TODO: Use filters to fetch filtered jobs from API
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Discover
        </Text>
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

      {/* Swipe Deck */}
      <View style={styles.deckContainer}>
        <SwipeDeck
          ref={swipeDeckRef}
          jobs={MOCK_JOBS}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
      </View>

      {/* Action Buttons */}
      <View
        style={[
          styles.actionsContainer,
          { backgroundColor: colors.surfaceSecondary },
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

        {/* Voice Command (ChatGPT Style) */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.smallButton,
            { backgroundColor: isListening ? colors.text : colors.surface },
          ]}
          onPress={handleVoiceCommand}
        >
          {isListening ? (
            <VoiceActivityIcon color={colors.background} />
          ) : (
            <MaterialCommunityIcons
              name="waveform"
              size={24}
              color={colors.text}
            />
          )}
        </TouchableOpacity>
      </View>

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
        selectedProfileId={selectedProfileId}
        profiles={MOCK_PROFILES}
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
    bottom: spacing[6],
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
