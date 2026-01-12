import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../../src/components";
import { borderRadius, spacing, typography } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { useOnboardingStore } from "../../src/stores";

const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
];
const EXPERIENCE_LEVELS = [
  "Entry Level",
  "Mid Level",
  "Senior",
  "Lead",
  "Manager",
  "Director",
  "Executive",
];
const WORK_MODES = ["On-site", "Remote", "Hybrid"];

export default function PreferencesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    currentStep,
    totalSteps,
    preferences,
    updatePreferences,
    nextStep,
    prevStep,
  } = useOnboardingStore();

  const toggleJobType = (type: string) => {
    const current = preferences.jobType || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updatePreferences({ jobType: updated });
  };

  const toggleExperience = (level: string) => {
    const current = preferences.experience || [];
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    updatePreferences({ experience: updated });
  };

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            Job Preferences
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tell us what kind of jobs you're looking for
          </Text>
        </View>

        {/* Job Types */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Job Type
          </Text>
          <View style={styles.chipContainer}>
            {JOB_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  {
                    backgroundColor: preferences.jobType?.includes(type)
                      ? colors.primary
                      : colors.surfaceSecondary,
                    borderColor: preferences.jobType?.includes(type)
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={() => toggleJobType(type)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: preferences.jobType?.includes(type)
                        ? "#FFFFFF"
                        : colors.text,
                    },
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Experience Level */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Experience Level
          </Text>
          <View style={styles.chipContainer}>
            {EXPERIENCE_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.chip,
                  {
                    backgroundColor: preferences.experience?.includes(level)
                      ? colors.primary
                      : colors.surfaceSecondary,
                    borderColor: preferences.experience?.includes(level)
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={() => toggleExperience(level)}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: preferences.experience?.includes(level)
                        ? "#FFFFFF"
                        : colors.text,
                    },
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Remote Only */}
        <View style={styles.section}>
          <View
            style={[
              styles.toggleRow,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <View style={styles.toggleInfo}>
              <Ionicons name="home-outline" size={24} color={colors.primary} />
              <View>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>
                  Remote Only
                </Text>
                <Text
                  style={[
                    styles.toggleSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  Only show remote job opportunities
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.remoteOnly || false}
              onValueChange={(value) =>
                updatePreferences({ remoteOnly: value })
              }
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={
                preferences.remoteOnly ? colors.primary : colors.textTertiary
              }
            />
          </View>
        </View>

        {/* Salary Range */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Salary Expectation
          </Text>
          <View style={styles.salaryRow}>
            {["$50k+", "$75k+", "$100k+", "$150k+", "$200k+"].map(
              (salary, index) => {
                const values = [50000, 75000, 100000, 150000, 200000];
                const isSelected = preferences.salary?.[0] === values[index];

                return (
                  <TouchableOpacity
                    key={salary}
                    style={[
                      styles.salaryChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surfaceSecondary,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() =>
                      updatePreferences({ salary: [values[index], 500000] })
                    }
                  >
                    <Text
                      style={[
                        styles.salaryText,
                        { color: isSelected ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      {salary}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </View>

        {/* Tip */}
        <View style={[styles.tip, { backgroundColor: colors.primary + "10" }]}>
          <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            You can always update these preferences later in your profile
            settings
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
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
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  header: {
    marginBottom: spacing[6],
  },
  backButton: {
    marginBottom: spacing[4],
    marginLeft: -spacing[2],
    padding: spacing[2],
    alignSelf: "flex-start",
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "700",
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    marginBottom: spacing[3],
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
  },
  toggleTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    marginBottom: spacing[0.5],
  },
  toggleSubtitle: {
    fontSize: typography.fontSize.sm,
  },
  salaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  salaryChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  salaryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
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
    paddingBottom: spacing[6],
  },
});
