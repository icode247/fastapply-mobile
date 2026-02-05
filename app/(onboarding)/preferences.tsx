import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../src/components";
import { JobPreferencesForm } from "../../src/components/feed/JobPreferencesForm";
import { borderRadius, spacing, typography } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { useOnboardingStore } from "../../src/stores";

export default function PreferencesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    currentStep,
    totalSteps,
    jobPreferences,
    updateJobPreferences,
    resetJobPreferences,
    nextStep,
    prevStep,
  } = useOnboardingStore();

  const handleContinue = () => {
    nextStep();
    router.push("/(onboarding)/complete");
  };

  const handleBack = () => {
    prevStep();
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.title, { color: colors.text }]}>
            Job Preferences
          </Text>
          <TouchableOpacity onPress={resetJobPreferences}>
            <Text style={[styles.clearText, { color: colors.textSecondary }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tell us what kind of jobs you're looking for
        </Text>
      </View>

      {/* Job Preferences Form - Same as JobFiltersModal */}
      <View style={styles.formContainer}>
        <JobPreferencesForm
          values={jobPreferences}
          onChange={updateJobPreferences}
        />
      </View>

      {/* Tip */}
      <View
        style={[styles.tipContainer, { backgroundColor: colors.background }]}
      >
        <View style={[styles.tip, { backgroundColor: colors.primary + "10" }]}>
          <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            You can always update these preferences later in your profile
            settings
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View
        style={[styles.actions, { backgroundColor: colors.background }]}
      >
        <Button title="Continue" onPress={handleContinue} fullWidth size="lg" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing[2],
    textAlign: "center",
  },
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  backButton: {
    marginBottom: spacing[4],
    marginLeft: -spacing[2],
    padding: spacing[2],
    alignSelf: "flex-start",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[2],
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "700",
  },
  clearText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing[2],
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: spacing[6],
  },
  tipContainer: {
    paddingHorizontal: spacing[6],
  },
  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[3],
  },
  tipText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
  },
});
