import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../ui/Text";
import { spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { Demographics } from "../../types";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-binary", value: "non_binary" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

const RACE_OPTIONS = [
  { label: "White", value: "white" },
  { label: "Black or African American", value: "black" },
  { label: "Asian", value: "asian" },
  { label: "Hispanic or Latino", value: "hispanic" },
  { label: "Native American or Alaska Native", value: "native_american" },
  { label: "Native Hawaiian or Pacific Islander", value: "pacific_islander" },
  { label: "Two or More Races", value: "two_or_more" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

const DISABILITY_OPTIONS = [
  { label: "Yes, I have a disability", value: "yes" },
  { label: "No, I don't have a disability", value: "no" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

const VETERAN_OPTIONS = [
  { label: "Yes, I am a protected veteran", value: "yes" },
  { label: "No, I am not a protected veteran", value: "no" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

interface DemographicsSectionProps {
  demographics: Demographics;
  onChange: (demographics: Demographics) => void;
}

export const DemographicsSection: React.FC<DemographicsSectionProps> = ({
  demographics,
  onChange,
}) => {
  const { colors } = useTheme();

  const updateField = (field: keyof Demographics, value: string) => {
    onChange({
      ...demographics,
      [field]: value,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Demographics (Optional)
      </Text>

      <Select
        label="Gender"
        value={demographics.gender}
        options={GENDER_OPTIONS}
        onSelect={(val) => updateField("gender", val)}
        placeholder="Select gender"
      />

      <Input
        label="Date of Birth"
        value={demographics.dateOfBirth}
        onChangeText={(t) => updateField("dateOfBirth", t)}
        placeholder="YYYY-MM-DD"
      />

      <Select
        label="Race / Ethnicity"
        value={demographics.race}
        options={RACE_OPTIONS}
        onSelect={(val) => updateField("race", val)}
        placeholder="Select race/ethnicity"
      />

      <Select
        label="Disability Status"
        value={demographics.disabilityStatus}
        options={DISABILITY_OPTIONS}
        onSelect={(val) => updateField("disabilityStatus", val)}
        placeholder="Select disability status"
      />

      <Select
        label="Veteran Status"
        value={demographics.veteranStatus}
        options={VETERAN_OPTIONS}
        onSelect={(val) => updateField("veteranStatus", val)}
        placeholder="Select veteran status"
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
