import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Linking,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, LoadingScreen } from "../../src/components";
import { spacing, typography } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { applicationService } from "../../src/services";
import { getApiErrorMessage } from "../../src/services/api";
import { Application } from "../../src/types";
import { formatDateTime, formatRelativeTime } from "../../src/utils/formatters";

const { width } = Dimensions.get("window");

// Helper for resume filename
const getCleanFileName = (path: string) => {
  if (!path) return "Resume";
  try {
    const decoded = decodeURIComponent(path);
    const cleanPath = decoded.split("?")[0];
    return cleanPath.split("/").pop() || cleanPath; // Get basename
  } catch {
    return path.split("/").pop() || path;
  }
};

const STATUS_CONFIG: Record<
  string,
  { color: string; label: string; icon: string; bg: string }
> = {
  submitted: {
    color: "#3B82F6",
    label: "Applied",
    icon: "checkmark-circle",
    bg: "#EFF6FF",
  },
  pending: {
    color: "#F59E0B",
    label: "Pending",
    icon: "time",
    bg: "#FFFBEB",
  },
  processing: {
    color: "#8B5CF6",
    label: "Processing",
    icon: "sync",
    bg: "#F5F3FF",
  },
  completed: {
    color: "#10B981",
    label: "Completed",
    icon: "checkmark-done-circle",
    bg: "#ECFDF5",
  },
  failed: {
    color: "#EF4444",
    label: "Failed",
    icon: "alert-circle",
    bg: "#FEF2F2",
  },
  cancelled: {
    color: "#6B7280",
    label: "Cancelled",
    icon: "close-circle",
    bg: "#F9FAFB",
  },
};

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerScroll = useRef(new Animated.Value(0)).current;

  const loadApplication = async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await applicationService.getApplication(id);
      setApplication(data);

      // Start animations once data is loaded
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadApplication();
  };

  const handleRetry = async () => {
    if (!application) return;

    setIsRetrying(true);
    try {
      await applicationService.retryApplication(application.id);
      Alert.alert("Success", "Application has been queued for retry");
      loadApplication();
    } catch (err) {
      Alert.alert("Error", getApiErrorMessage(err));
    } finally {
      setIsRetrying(false);
    }
  };

  const handleOpenJob = () => {
    if (application?.jobUrl) {
      Linking.openURL(application.jobUrl);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Application",
      "Are you sure you want to delete this application?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await applicationService.deleteApplication(application!.id);
              router.back();
            } catch (err) {
              Alert.alert("Error", getApiErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Loading application..." />;
  }

  if (error || !application) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.error}
          />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error || "Application not found"}
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = STATUS_CONFIG[application.status.toLowerCase()] || {
    color: colors.textSecondary,
    label: application.status,
    icon: "help-circle",
    bg: colors.level1,
  };

  // Header opacity interpolation
  const headerBgOpacity = headerScroll.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Floating Header */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: colors.background,
            opacity: headerBgOpacity,
            zIndex: 10,
          },
        ]}
      >
        {/* Placeholder for background fade */}
      </Animated.View>

      <View style={[styles.headerControls, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.iconButton,
            {
              backgroundColor: isDark
                ? "rgba(0,0,0,0.3)"
                : "rgba(255,255,255,0.8)",
            },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={handleDelete}
          style={[
            styles.iconButton,
            {
              backgroundColor: isDark
                ? "rgba(0,0,0,0.3)"
                : "rgba(255,255,255,0.8)",
            },
          ]}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: headerScroll } } }],
          { useNativeDriver: false } // opacity not supported by native driver sometimes on View style props? Actually it is.
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Section */}
        <View>
          <View
            style={[styles.contentContainer, { paddingTop: insets.top + 60 }]}
          >
            {/* Main Info */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <View style={styles.mainInfoCenter}>
                <View
                  style={[
                    styles.companyLogoLarge,
                    {
                      backgroundColor: colors.surface,
                      shadowColor: colors.shadow,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.companyInitialLarge,
                      { color: colors.primary },
                    ]}
                  >
                    {(application.company || "U")[0].toUpperCase()}
                  </Text>
                </View>

                <Text style={[styles.titleLarge, { color: colors.text }]}>
                  {application.jobTitle || "Unknown Position"}
                </Text>
                <Text
                  style={[styles.companyLarge, { color: colors.textSecondary }]}
                >
                  {application.company || "Unknown Company"}
                </Text>

                {/* Status Pill */}
                <View
                  style={[
                    styles.statusPillLarge,
                    {
                      backgroundColor: isDark
                        ? statusInfo.color + "30"
                        : statusInfo.bg,
                    },
                  ]}
                >
                  <Ionicons
                    name={statusInfo.icon as any}
                    size={16}
                    color={statusInfo.color}
                  />
                  <Text
                    style={[
                      styles.statusTextLarge,
                      { color: statusInfo.color },
                    ]}
                  >
                    {statusInfo.label}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                {application.jobUrl && (
                  <TouchableOpacity
                    onPress={handleOpenJob}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="open-outline" size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>View Job</Text>
                  </TouchableOpacity>
                )}
                {application.status === "failed" && (
                  <TouchableOpacity
                    onPress={handleRetry}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: colors.error },
                    ]}
                  >
                    <Ionicons name="refresh" size={20} color="#FFF" />
                    <Text style={styles.actionBtnText}>Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            {/* Details Grid */}
            <Animated.View
              style={[
                styles.section,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Text style={[styles.sectionHeader, { color: colors.text }]}>
                Details
              </Text>
              <View
                style={[
                  styles.grid,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceSecondary
                      : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <DetailItem
                  label="Location"
                  value={application.jobLocation || "Remote"}
                  icon="location-outline"
                  colors={colors}
                />
                <DetailItem
                  label="Platform"
                  value={application.platform || "Unknown"}
                  icon="globe-outline"
                  colors={colors}
                />
                <DetailItem
                  label="Applied"
                  value={formatRelativeTime(
                    application.appliedAt || application.createdAt
                  )}
                  icon="calendar-outline"
                  colors={colors}
                />
                <DetailItem
                  label="Source"
                  value={
                    application.source === "automation"
                      ? "Auto-Apply"
                      : "Manual"
                  }
                  icon="flash-outline"
                  colors={colors}
                />
              </View>
            </Animated.View>

            {/* Timeline */}
            <Animated.View
              style={[
                styles.section,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Text style={[styles.sectionHeader, { color: colors.text }]}>
                Timeline
              </Text>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark
                      ? colors.surfaceSecondary
                      : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TimelineRow
                  title="Application Created"
                  date={application.createdAt}
                  icon="add-circle"
                  color={colors.success}
                  isLast={
                    !application.appliedAt && application.status !== "failed"
                  }
                  colors={colors}
                />
                {application.appliedAt && (
                  <TimelineRow
                    title="Successfully Applied"
                    date={application.appliedAt}
                    icon="checkmark-circle"
                    color={colors.primary}
                    isLast={true}
                    colors={colors}
                  />
                )}
                {application.status === "failed" && (
                  <TimelineRow
                    title="Application Failed"
                    date={application.updatedAt}
                    icon="alert-circle"
                    color={colors.error}
                    isLast={true}
                    colors={colors}
                    description={application.failedReason}
                  />
                )}
              </View>
            </Animated.View>

            {/* Resume */}
            {application.resumeUsed && (
              <Animated.View
                style={[
                  styles.section,
                  { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
              >
                <Text style={[styles.sectionHeader, { color: colors.text }]}>
                  Resume
                </Text>
                <TouchableOpacity
                  style={[
                    styles.resumeCard,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceSecondary
                        : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.fileIcon}>
                    <Ionicons name="document-text" size={28} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fileName, { color: colors.text }]}>
                      {getCleanFileName(application.resumeUsed.fileName)}
                    </Text>
                    <Text
                      style={[styles.fileSub, { color: colors.textSecondary }]}
                    >
                      Attached to application
                    </Text>
                  </View>
                  <Ionicons
                    name="download-outline"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Q&A */}
            {application.questionsAnswered &&
              application.questionsAnswered.length > 0 && (
                <Animated.View
                  style={[
                    styles.section,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <Text style={[styles.sectionHeader, { color: colors.text }]}>
                    Questions ({application.questionsAnswered.length})
                  </Text>
                  {application.questionsAnswered.map((qa, i) => (
                    <View
                      key={i}
                      style={[
                        styles.qaItem,
                        {
                          backgroundColor: isDark
                            ? colors.surfaceSecondary
                            : colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.qaQuestion, { color: colors.text }]}>
                        {qa.question}
                      </Text>
                      <View
                        style={[
                          styles.qaAnswerBox,
                          {
                            backgroundColor: isDark
                              ? "rgba(0,0,0,0.2)"
                              : colors.level1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.qaAnswer,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {qa.answer}
                        </Text>
                      </View>
                    </View>
                  ))}
                </Animated.View>
              )}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const DetailItem = ({ label, value, icon, colors }: any) => (
  <View style={styles.detailItem}>
    <View style={[styles.detailIcon, { backgroundColor: colors.level1 }]}>
      <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
    </View>
    <View>
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[styles.detailValue, { color: colors.text }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  </View>
);

const TimelineRow = ({
  title,
  date,
  icon,
  color,
  isLast,
  colors,
  description,
}: any) => (
  <View style={styles.timelineRow}>
    <View style={styles.timelineLeft}>
      <Ionicons name={icon as any} size={24} color={color} />
      {!isLast && (
        <View
          style={[styles.timelineLine, { backgroundColor: colors.border }]}
        />
      )}
    </View>
    <View style={[styles.timelineRight, !isLast && { paddingBottom: 24 }]}>
      <Text style={[styles.timelineTitle, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>
        {formatDateTime(date)}
      </Text>
      {description && (
        <Text style={{ color: colors.error, marginTop: 4 }}>{description}</Text>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100, // Sufficient to cover top area
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  headerControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    paddingHorizontal: spacing[4],
    alignItems: "center",
    height: 100, // Match header height area approx
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[6],
    gap: spacing[4],
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    textAlign: "center",
  },
  mainInfoCenter: {
    alignItems: "center",
    marginBottom: spacing[6],
  },
  companyLogoLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[4],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  companyInitialLarge: {
    fontSize: 32,
    fontWeight: "bold",
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: "800", // heavy
    textAlign: "center",
    marginBottom: spacing[1],
    lineHeight: 32,
  },
  companyLarge: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: spacing[4],
  },
  statusPillLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 50,
    gap: 6,
  },
  statusTextLarge: {
    fontWeight: "600",
    fontSize: 15,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing[4],
    marginBottom: spacing[8],
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  actionBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing[4],
    marginLeft: spacing[1],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[4],
  },
  detailItem: {
    width: "45%",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: spacing[2],
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing[6],
  },
  timelineRow: {
    flexDirection: "row",
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: spacing[4],
    width: 24,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineRight: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 13,
  },
  resumeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing[4],
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#ea580c", // Orange
    justifyContent: "center",
    alignItems: "center",
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  fileSub: {
    fontSize: 13,
  },
  qaItem: {
    padding: spacing[5],
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing[4],
  },
  qaQuestion: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing[3],
    lineHeight: 24,
  },
  qaAnswerBox: {
    padding: spacing[4],
    borderRadius: 12,
  },
  qaAnswer: {
    fontSize: 15,
    lineHeight: 22,
  },
});
