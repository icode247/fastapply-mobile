import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../ui/Text";
import { spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { CreateJobProfileDto } from "../../types";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

const TIMEZONE_OPTIONS = [
  { label: "EST (Eastern Standard Time)", value: "EST" },
  { label: "CST (Central Standard Time)", value: "CST" },
  { label: "MST (Mountain Standard Time)", value: "MST" },
  { label: "PST (Pacific Standard Time)", value: "PST" },
  { label: "AKST (Alaska Standard Time)", value: "AKST" },
  { label: "HST (Hawaii Standard Time)", value: "HST" },
  { label: "GMT (Greenwich Mean Time)", value: "GMT" },
  { label: "CET (Central European Time)", value: "CET" },
  { label: "EET (Eastern European Time)", value: "EET" },
  { label: "GST (Gulf Standard Time)", value: "GST" },
  { label: "IST (India Standard Time)", value: "IST" },
  { label: "SGT (Singapore Time)", value: "SGT" },
  { label: "JST (Japan Standard Time)", value: "JST" },
  { label: "AEST (Australian Eastern Time)", value: "AEST" },
  { label: "NZST (New Zealand Standard Time)", value: "NZST" },
  { label: "None of the time zones listed", value: "other" },
];

interface PersonalSectionProps {
  formData: Partial<CreateJobProfileDto>;
  onChange: (field: keyof CreateJobProfileDto, value: any) => void;
}

export const PersonalSection: React.FC<PersonalSectionProps> = ({
  formData,
  onChange,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Personal Info
      </Text>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Input
            label="First Name *"
            value={formData.firstName}
            onChangeText={(t) => onChange("firstName", t)}
            placeholder="John"
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="Last Name *"
            value={formData.lastName}
            onChangeText={(t) => onChange("lastName", t)}
            placeholder="Doe"
          />
        </View>
      </View>

      <Input
        label="Email Address *"
        value={formData.email}
        onChangeText={(t) => onChange("email", t)}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="john@example.com"
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Input
            label="Country Code *"
            value={formData.phoneCountryCode}
            onChangeText={(t) => onChange("phoneCountryCode", t)}
            placeholder="+1"
          />
        </View>
        <View style={{ flex: 2 }}>
          <Input
            label="Phone Number *"
            value={formData.phoneNumber}
            onChangeText={(t) => onChange("phoneNumber", t)}
            keyboardType="phone-pad"
            placeholder="(555) 123-4567"
          />
        </View>
      </View>

      <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
        Address
      </Text>

      <Input
        label="Street Address"
        value={formData.streetAddress}
        onChangeText={(t) => onChange("streetAddress", t)}
        placeholder="123 Main St"
      />

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Input
            label="City"
            value={formData.currentCity}
            onChangeText={(t) => onChange("currentCity", t)}
            placeholder="New York"
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="State / Province"
            value={formData.state}
            onChangeText={(t) => onChange("state", t)}
            placeholder="NY"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Input
            label="Country *"
            value={formData.country}
            onChangeText={(t) => onChange("country", t)}
            placeholder="USA"
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="Zip / Postal Code *"
            value={formData.zipcode}
            onChangeText={(t) => onChange("zipcode", t)}
            placeholder="10001"
          />
        </View>
      </View>

      <Select
        label="Timezone"
        value={formData.timezone}
        options={TIMEZONE_OPTIONS}
        onSelect={(val) => onChange("timezone", val)}
        placeholder="Select your timezone"
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
  subTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  row: {
    flexDirection: "row",
  },
  halfInput: {
    flex: 1,
    marginRight: spacing[2],
  },
});
