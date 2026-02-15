import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../ui/Text";
import { spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { JobPreferences } from "../../types";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

const WORK_AUTH_OPTIONS = [
  { label: "Citizen", value: "citizen" },
  { label: "Permanent Resident", value: "permanent_resident" },
  { label: "Work Visa / Work Permit", value: "work_visa" },
  { label: "Student Visa", value: "student_visa" },
  { label: "Dependent Visa", value: "dependent_visa" },
  { label: "No work authorization yet", value: "no_authorization" },
];

const NOTICE_PERIOD_OPTIONS = [
  { label: "Immediate", value: "immediate" },
  { label: "2 weeks", value: "2_weeks" },
  { label: "1 month", value: "1_month" },
  { label: "2 months", value: "2_months" },
  { label: "3 months", value: "3_months" },
  { label: "More than 3 months", value: "more_than_3_months" },
];

const SPONSORSHIP_OPTIONS = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const SECURITY_CLEARANCE_OPTIONS = [
  { label: "No security clearance", value: "none" },
  { label: "Yes, I have security clearance", value: "yes" },
];

interface PreferencesSectionProps {
  preferences: JobPreferences;
  onChange: (prefs: JobPreferences) => void;
  workAuthorization?: string;
  requiresSponsorship?: boolean;
  onAuthChange: (
    field: "workAuthorization" | "requiresSponsorship",
    value: any
  ) => void;
}

export const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  preferences,
  onChange,
  workAuthorization,
  requiresSponsorship,
  onAuthChange,
}) => {
  const { colors } = useTheme();

  const updatePref = (field: keyof JobPreferences, value: any) => {
    onChange({
      ...preferences,
      [field]: value,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Work Preferences
      </Text>

      {/* <Input
        label="Desired Annual Salary"
        value={
          preferences.desiredSalary ? String(preferences.desiredSalary) : ""
        }
        onChangeText={(t) => updatePref("desiredSalary", parseInt(t) || 0)}
        keyboardType="numeric"
        placeholder="120000"
      /> */}

      <Select
        label="Work Authorization Status"
        value={workAuthorization}
        options={WORK_AUTH_OPTIONS}
        onSelect={(val) => onAuthChange("workAuthorization", val)}
        placeholder="Select authorization status"
      />

      <Select
        label="Require Visa Sponsorship?"
        value={requiresSponsorship ? "yes" : "no"}
        options={SPONSORSHIP_OPTIONS}
        onSelect={(val) => onAuthChange("requiresSponsorship", val === "yes")}
        placeholder="Select option"
      />

      <Select
        label="Security Clearance"
        value={preferences.securityClearance}
        options={SECURITY_CLEARANCE_OPTIONS}
        onSelect={(val) => updatePref("securityClearance", val)}
        placeholder="Select clearance status"
      />

      <Select
        label="Notice Period"
        value={preferences.noticePeriod}
        options={NOTICE_PERIOD_OPTIONS}
        onSelect={(val) => updatePref("noticePeriod", val)}
        placeholder="Select notice period"
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
