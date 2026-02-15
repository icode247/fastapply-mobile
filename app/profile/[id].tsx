import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../src/components/ui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, UpgradePrompt } from "../../src/components";
import { canUploadResume } from "../../src/constants/subscription-limits";
import { spacing, typography } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { profileService, subscriptionService } from "../../src/services";
import { JobProfile, Resume } from "../../src/types";

export default function ProfileDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Subscription state
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptData, setUpgradePromptData] = useState<{
    message: string;
    limitType: "profiles" | "resumes" | "applications";
    currentCount: number;
    limit: number;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchData();
      }
    }, [id])
  );

  const fetchData = async () => {
    try {
      // Fetch subscription info
      try {
        const subscription = await subscriptionService.getCurrentSubscription();
        setCurrentTier(subscription.tier || "free");
      } catch {
        setCurrentTier("free");
      }

      const [profileData, resumesData] = await Promise.all([
        profileService.getProfile(id),
        profileService.getResumes(id).catch(() => []),
      ]);
      setProfile(profileData);
      setResumes(resumesData);
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      Alert.alert("Error", "Failed to load profile details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPrimary = async () => {
    try {
      await profileService.setPrimaryProfile(id);
      fetchData();
      Alert.alert("Success", "Set as primary profile");
    } catch (error) {
      Alert.alert("Error", "Failed to set as primary");
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete Profile", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await profileService.deleteProfile(id);
            router.back();
          } catch (error) {
            Alert.alert("Error", "Failed to delete profile");
          }
        },
      },
    ]);
  };

  const handleUploadResume = async () => {
    // Check resume upload limit
    const { allowed, limit, current } = canUploadResume(
      currentTier,
      resumes.length
    );

    if (!allowed) {
      setUpgradePromptData({
        message: `You've reached the maximum of ${limit} resume${
          limit !== 1 ? "s" : ""
        } per profile on your ${
          currentTier === "free" ? "Free" : currentTier
        } plan. Upgrade to upload more resumes.`,
        limitType: "resumes",
        currentCount: current,
        limit: limit,
      });
      setShowUpgradePrompt(true);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const file = result.assets[0];

      setIsUploading(true);
      await profileService.uploadResume(id, {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/pdf",
        file: (file as any).file, // Web only - actual File object
      });

      fetchData(); // Refresh list
      Alert.alert("Success", "Resume uploaded");
    } catch (error) {
      console.error("Upload error", error);
      Alert.alert("Error", "Failed to upload resume");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrimaryResume = async (resumeId: string) => {
    try {
      await profileService.setPrimaryResume(resumeId);
      fetchData();
    } catch (error) {
      Alert.alert("Error", "Failed to set primary resume");
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    Alert.alert("Delete Resume", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await profileService.deleteResume(resumeId);
            fetchData();
          } catch (error) {
            Alert.alert("Error", "Failed to delete resume");
          }
        },
      },
    ]);
  };

  if (isLoading || !profile) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + spacing[2], borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {profile.name}
            </Text>
            {profile.isPrimary && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  Primary Profile
                </Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => router.push(`/profile/edit/${id}`)}
            style={{ padding: 8, marginRight: 4 }}
          >
            <Ionicons name="create-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={profile.isPrimary ? undefined : handleSetPrimary}
            style={{ padding: 8 }}
            disabled={profile.isPrimary}
          >
            <Ionicons
              name={profile.isPrimary ? "star" : "star-outline"}
              size={24}
              color={profile.isPrimary ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Info Card */}
          <Card style={styles.card} variant="elevated">
            <View style={styles.infoRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headline, { color: colors.text }]}>
                  {profile.headline || "No Headline"}
                </Text>
                <Text style={[styles.subtext, { color: colors.textSecondary }]}>
                  {profile.currentCity || "No Location"} •{" "}
                  {profile.yearsOfExperience || 0} Years Exp
                </Text>
                {profile.timezone && (
                  <Text style={[styles.subtext, { color: colors.textSecondary, marginTop: 2 }]}>
                    Timezone: {profile.timezone}
                  </Text>
                )}
              </View>
            </View>

            {profile.summary && (
              <View
                style={[
                  styles.section,
                  {
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    paddingTop: 16,
                  },
                ]}
              >
                <Text
                  style={[styles.sectionTitle, { color: colors.textSecondary }]}
                >
                  About
                </Text>
                <Text style={[styles.bodyText, { color: colors.text }]}>
                  {profile.summary}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.section,
                {
                  borderTopColor: colors.border,
                  borderTopWidth: 1,
                  paddingTop: 16,
                },
              ]}
            >
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                Skills
              </Text>
              <View style={styles.skillsRow}>
                {profile.skills?.map((skill, index) => (
                  <View
                    key={index}
                    style={[
                      styles.skillChip,
                      { backgroundColor: colors.level2 },
                    ]}
                  >
                    <Text style={[styles.skillText, { color: colors.text }]}>
                      {skill}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Card>

          {/* Education Section */}
          {profile.education && profile.education.length > 0 && (
            <Card style={styles.card} variant="elevated">
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                Education
              </Text>
              {profile.education.map((edu, index) => (
                <View
                  key={edu.id || index}
                  style={[
                    styles.eduItem,
                    index > 0 && {
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                      paddingTop: 12,
                    },
                  ]}
                >
                  <Text style={[styles.eduDegree, { color: colors.text }]}>
                    {edu.degree}
                    {edu.major || edu.fieldOfStudy
                      ? ` in ${edu.major || edu.fieldOfStudy}`
                      : ""}
                  </Text>
                  <Text
                    style={[styles.eduSchool, { color: colors.textSecondary }]}
                  >
                    {edu.school}
                  </Text>
                  <View style={styles.eduMeta}>
                    {edu.gpa && (
                      <Text
                        style={[
                          styles.eduMetaText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        GPA: {edu.gpa}
                      </Text>
                    )}
                    {edu.endDate && (
                      <Text
                        style={[
                          styles.eduMetaText,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {edu.startDate ? `${edu.startDate} - ` : ""}
                        {edu.endDate}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Resumes Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitleBig, { color: colors.text }]}>
              Resumes
            </Text>
            <TouchableOpacity
              onPress={handleUploadResume}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  Upload New
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {profile.resumes?.map((resume) => (
            <Card key={resume.id} style={styles.resumeCard} variant="outlined">
              <View style={styles.resumeRow}>
                <Ionicons
                  name="document-text"
                  size={32}
                  color={
                    resume.isPrimary ? colors.primary : colors.textSecondary
                  }
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.resumeName, { color: colors.text }]}>
                    {resume.fileName}
                  </Text>
                  <Text
                    style={[styles.resumeDate, { color: colors.textSecondary }]}
                  >
                    {new Date(resume.uploadedAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.resumeActions}>
                  {!resume.isPrimary && (
                    <TouchableOpacity
                      onPress={() => handleSetPrimaryResume(resume.id)}
                      style={styles.actionIcon}
                    >
                      <Ionicons
                        name="star-outline"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDeleteResume(resume.id)}
                    style={styles.actionIcon}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}

          <Button
            title="Delete Profile"
            variant="outline"
            style={{ marginTop: 24, borderColor: colors.error }}
            textStyle={{ color: colors.error }}
            onPress={handleDelete}
          />
        </View>
      </ScrollView>

      {/* Upgrade Prompt Modal */}
      {upgradePromptData && (
        <UpgradePrompt
          visible={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          title="Resume Limit Reached"
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: spacing[4],
  },
  profileName: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  content: {
    padding: spacing[6],
  },
  card: {
    marginBottom: spacing[6],
    padding: spacing[5],
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing[4],
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6366f1",
  },
  headline: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtext: {
    fontSize: typography.fontSize.sm,
  },
  section: {
    marginTop: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: spacing[2],
    letterSpacing: 0.5,
  },
  bodyText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  sectionTitleBig: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
  },
  resumeCard: {
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  resumeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  resumeName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  resumeDate: {
    fontSize: 12,
  },
  resumeActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    padding: 8,
  },
  eduItem: {
    marginBottom: 12,
  },
  eduDegree: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    marginBottom: 2,
  },
  eduSchool: {
    fontSize: typography.fontSize.sm,
    marginBottom: 4,
  },
  eduMeta: {
    flexDirection: "row",
    gap: 12,
  },
  eduMetaText: {
    fontSize: typography.fontSize.xs,
  },
});
