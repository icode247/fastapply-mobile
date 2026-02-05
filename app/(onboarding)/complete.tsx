import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../src/components";
import { borderRadius, spacing, typography } from "../../src/constants/theme";
import { useAuth, useTheme } from "../../src/hooks";
import { profileService } from "../../src/services";
import { getApiErrorMessage } from "../../src/services/api";
import { useOnboardingStore } from "../../src/stores";

export default function CompleteScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { completeOnboarding } = useAuth();
  const { getProfileData, reset, resumeFile } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const profileData = getProfileData();

      // Create job profile
      const profile = await profileService.createProfile({
        name: "Primary Profile",
        ...profileData,
      });

      // Upload resume if we have one
      if (resumeFile) {
        try {
          await profileService.uploadResume(profile.id, resumeFile);
        } catch (uploadError) {
          console.warn("Resume upload failed:", uploadError);
          // Don't fail the whole process if resume upload fails
        }
      }

      // Set as primary profile
      await profileService.setPrimaryProfile(profile.id);

      // Mark onboarding as complete
      completeOnboarding();

      // Reset onboarding store
      reset();

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        {/* Success Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.success + "20" },
          ]}
        >
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          You're all set!
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your profile is ready. Start discovering and applying to your dream
          jobs.
        </Text>

        {/* Features */}
        <View style={styles.features}>
          {[
            {
              icon: "rocket-outline",
              title: "One-tap Apply",
              description: "Apply to jobs with a single tap",
            },
            {
              icon: "sparkles-outline",
              title: "AI Matching",
              description: "Get matched with relevant jobs",
            },
            {
              icon: "stats-chart-outline",
              title: "Track Progress",
              description: "Monitor all your applications",
            },
          ].map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureCard,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <View
                style={[
                  styles.featureIcon,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Ionicons
                  name={feature.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {feature.title}
                </Text>
                <Text
                  style={[
                    styles.featureDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Action */}
      <View style={styles.actions}>
        <Button
          title="Get Started"
          onPress={handleComplete}
          loading={isLoading}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[10],
    alignItems: "center",
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[6],
  },
  title: {
    fontSize: typography.fontSize["3xl"],
    fontWeight: "700",
    marginBottom: spacing[3],
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
    marginBottom: spacing[8],
  },
  features: {
    width: "100%",
    gap: spacing[3],
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[4],
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    marginBottom: spacing[0.5],
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
  },
  actions: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
});
