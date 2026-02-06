import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../ui/Text";
import { spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { CreateJobProfileDto } from "../../types";
import { Input } from "../ui/Input";

interface ProfessionalSectionProps {
  formData: Partial<CreateJobProfileDto>;
  onChange: (field: keyof CreateJobProfileDto, value: any) => void;
  skillsInput: string;
  setSkillsInput: (value: string) => void;
}

export const ProfessionalSection: React.FC<ProfessionalSectionProps> = ({
  formData,
  onChange,
  skillsInput,
  setSkillsInput,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Professional Info
      </Text>

      <Input
        label="Professional Headline"
        value={formData.headline}
        onChangeText={(t) => onChange("headline", t)}
        placeholder="Senior Software Engineer"
      />

      <Input
        label="Professional Summary"
        value={formData.summary}
        onChangeText={(t) => onChange("summary", t)}
        placeholder="Describe your professional background..."
        multiline
        numberOfLines={6}
        style={{ height: 120, textAlignVertical: "top" }}
      />

      <Input
        label="Years of Experience"
        value={
          formData.yearsOfExperience !== undefined
            ? String(formData.yearsOfExperience)
            : ""
        }
        onChangeText={(t) => onChange("yearsOfExperience", parseInt(t) || 0)}
        keyboardType="numeric"
        placeholder="5"
      />

      <Input
        label="Skills (comma separated)"
        value={skillsInput}
        onChangeText={setSkillsInput}
        placeholder="React, TypeScript, Node.js"
        // Note: Full chip input implementation can be added later as an enhancement
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing[2],
  },
});
