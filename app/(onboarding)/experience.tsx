import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../src/components/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card } from "../../src/components";
import { borderRadius, spacing, typography } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { useOnboardingStore } from "../../src/stores";

export default function ExperienceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    currentStep,
    totalSteps,
    experience,
    education,
    skills,
    yearsOfExperience,
    updateExperience,
    updateSkills,
    updatePersonalInfo,
    nextStep,
    prevStep,
  } = useOnboardingStore();

  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      updateSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    updateSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleContinue = () => {
    nextStep();
    router.push("/(onboarding)/preferences");
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
            Experience & Skills
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Review your work history and skills
          </Text>
        </View>

        {/* Years of Experience */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Years of Experience
          </Text>
          <View style={styles.yearsRow}>
            {[0, 1, 2, 3, 5, 7, 10].map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearChip,
                  {
                    backgroundColor:
                      yearsOfExperience === year
                        ? colors.primary
                        : colors.surfaceSecondary,
                    borderColor:
                      yearsOfExperience === year
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => updatePersonalInfo({ yearsOfExperience: year })}
              >
                <Text
                  style={[
                    styles.yearText,
                    {
                      color:
                        yearsOfExperience === year ? "#FFFFFF" : colors.text,
                    },
                  ]}
                >
                  {year === 10 ? "10+" : year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Work Experience */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Work Experience
            </Text>
            {experience.length > 0 && (
              <Text
                style={[styles.sectionCount, { color: colors.textSecondary }]}
              >
                {experience.length} {experience.length === 1 ? "role" : "roles"}
              </Text>
            )}
          </View>

          {experience.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <Ionicons
                name="briefcase-outline"
                size={32}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No work experience added yet
              </Text>
            </View>
          ) : (
            experience.map((exp, index) => (
              <Card
                key={index}
                variant="outlined"
                style={styles.experienceCard}
              >
                <View style={styles.experienceHeader}>
                  <View style={styles.experienceInfo}>
                    <Text
                      style={[styles.experienceTitle, { color: colors.text }]}
                    >
                      {exp.title}
                    </Text>
                    <Text
                      style={[
                        styles.experienceCompany,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {exp.company}
                    </Text>
                    <Text
                      style={[
                        styles.experienceDate,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {exp.startDate} - {exp.endDate || "Present"}
                    </Text>
                  </View>
                </View>
                {exp.description && (
                  <Text
                    style={[
                      styles.experienceDescription,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={3}
                  >
                    {exp.description}
                  </Text>
                )}
              </Card>
            ))
          )}
        </View>

        {/* Education */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Education
            </Text>
            {education.length > 0 && (
              <Text
                style={[styles.sectionCount, { color: colors.textSecondary }]}
              >
                {education.length}
              </Text>
            )}
          </View>

          {education.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <Ionicons
                name="school-outline"
                size={32}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No education added yet
              </Text>
            </View>
          ) : (
            education.map((edu, index) => (
              <Card
                key={index}
                variant="outlined"
                style={styles.experienceCard}
              >
                <Text style={[styles.experienceTitle, { color: colors.text }]}>
                  {edu.degree}
                </Text>
                <Text
                  style={[
                    styles.experienceCompany,
                    { color: colors.textSecondary },
                  ]}
                >
                  {edu.school}
                </Text>
                {edu.endDate && (
                  <Text
                    style={[
                      styles.experienceDate,
                      { color: colors.textTertiary },
                    ]}
                  >
                    Graduated {edu.endDate}
                  </Text>
                )}
              </Card>
            ))
          )}
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Skills
          </Text>

          <View
            style={[
              styles.skillInput,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <TextInput
              style={[styles.skillTextInput, { color: colors.text }]}
              placeholder="Add a skill..."
              placeholderTextColor={colors.textTertiary}
              value={newSkill}
              onChangeText={setNewSkill}
              onSubmitEditing={handleAddSkill}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddSkill}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.skillsContainer}>
            {skills.map((skill, index) => (
              <View
                key={index}
                style={[
                  styles.skillChip,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Text style={[styles.skillText, { color: colors.primary }]}>
                  {skill}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveSkill(skill)}>
                  <Ionicons name="close" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {skills.length === 0 && (
            <Text style={[styles.hintText, { color: colors.textTertiary }]}>
              Add skills relevant to your target jobs
            </Text>
          )}
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    marginBottom: spacing[3],
  },
  sectionCount: {
    fontSize: typography.fontSize.sm,
  },
  yearsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  yearChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  yearText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
  },
  emptyCard: {
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    alignItems: "center",
    gap: spacing[2],
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
  },
  experienceCard: {
    marginBottom: spacing[3],
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  experienceInfo: {
    flex: 1,
  },
  experienceTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    marginBottom: spacing[1],
  },
  experienceCompany: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[1],
  },
  experienceDate: {
    fontSize: typography.fontSize.xs,
  },
  experienceDescription: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  skillInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingLeft: spacing[4],
    marginBottom: spacing[3],
  },
  skillTextInput: {
    flex: 1,
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
  },
  addButton: {
    padding: spacing[3],
    borderRadius: borderRadius.md,
    margin: spacing[1],
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[2],
    paddingLeft: spacing[3],
    paddingRight: spacing[2],
    borderRadius: borderRadius.full,
    gap: spacing[1],
  },
  skillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
  },
  hintText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing[2],
  },
  actions: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
});
