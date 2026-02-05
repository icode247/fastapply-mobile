import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { JobTitlesPickerModal } from "./JobTitlesPickerModal";
import { LocationItem, LocationsPickerModal } from "./LocationsPickerModal";

export interface JobPreferencesFormValues {
  jobTitles: string[];
  locations: LocationItem[];
  jobTypes: string[];
  workModes: string[];
  experienceLevels: string[];
  salaryMin: number;
  salaryMax: number;
  remoteOnly: boolean;
  visaSponsorship: boolean;
}

interface JobPreferencesFormProps {
  values: JobPreferencesFormValues;
  onChange: (values: JobPreferencesFormValues) => void;
  showHeader?: boolean;
  onReset?: () => void;
}

const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
];
const WORK_MODES = ["Remote", "Hybrid", "On-site"];
const EXPERIENCE_LEVELS = [
  "Entry Level",
  "Mid Level",
  "Senior",
  "Lead",
  "Executive",
];

export const DEFAULT_JOB_PREFERENCES: JobPreferencesFormValues = {
  jobTitles: [],
  locations: [],
  jobTypes: [],
  workModes: [],
  experienceLevels: [],
  salaryMin: 30000,
  salaryMax: 200000,
  remoteOnly: false,
  visaSponsorship: false,
};

export const JobPreferencesForm: React.FC<JobPreferencesFormProps> = ({
  values,
  onChange,
  showHeader = false,
  onReset,
}) => {
  const { colors } = useTheme();
  const [showJobTitlesPicker, setShowJobTitlesPicker] = useState(false);
  const [showLocationsPicker, setShowLocationsPicker] = useState(false);

  const toggleArrayItem = (key: keyof JobPreferencesFormValues, item: string) => {
    const arr = values[key] as string[];
    if (arr.includes(item)) {
      onChange({ ...values, [key]: arr.filter((i) => i !== item) });
    } else {
      onChange({ ...values, [key]: [...arr, item] });
    }
  };

  const renderChipGroup = (
    title: string,
    items: string[],
    selectedItems: string[],
    filterKey: keyof JobPreferencesFormValues
  ) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.chipContainer}>
        {items.map((item) => {
          const isSelected = selectedItems.includes(item);
          return (
            <TouchableOpacity
              key={item}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.surfaceSecondary,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => toggleArrayItem(filterKey, item)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? "#FFF" : colors.text },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Optional Header with Reset */}
        {showHeader && onReset && (
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Job Preferences
            </Text>
            <TouchableOpacity onPress={onReset}>
              <Text style={[styles.resetText, { color: colors.textSecondary }]}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Job Titles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Job Titles
            </Text>
            <View style={styles.sectionHeaderRight}>
              {values.jobTitles.length > 0 && (
                <Text
                  style={[styles.countBadge, { color: colors.textSecondary }]}
                >
                  ({values.jobTitles.length})
                </Text>
              )}
              <TouchableOpacity
                onPress={() => setShowJobTitlesPicker(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.pickerButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setShowJobTitlesPicker(true)}
          >
            {values.jobTitles.length > 0 ? (
              <View style={styles.pickerContent}>
                <Text
                  style={[styles.pickerMainText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {values.jobTitles[0]}
                </Text>
                {values.jobTitles.length > 1 && (
                  <Text
                    style={[
                      styles.pickerSecondaryText,
                      { color: colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {values.jobTitles[1]}
                  </Text>
                )}
                {values.jobTitles.length > 2 && (
                  <Text
                    style={[
                      styles.pickerMoreText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    + {values.jobTitles.length - 2} more
                  </Text>
                )}
              </View>
            ) : (
              <Text
                style={[styles.pickerPlaceholder, { color: colors.textTertiary }]}
              >
                Add job titles to filter
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Locations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Locations
            </Text>
            <View style={styles.sectionHeaderRight}>
              {values.locations.length > 0 && (
                <Text
                  style={[styles.countBadge, { color: colors.textSecondary }]}
                >
                  ({values.locations.length})
                </Text>
              )}
              <TouchableOpacity
                onPress={() => setShowLocationsPicker(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.pickerButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setShowLocationsPicker(true)}
          >
            {values.locations.length > 0 ? (
              <View style={styles.pickerContent}>
                {values.locations.slice(0, 2).map((loc, index) => (
                  <Text
                    key={loc.id}
                    style={[
                      index === 0
                        ? styles.pickerMainText
                        : styles.pickerSecondaryText,
                      { color: colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {loc.name}
                  </Text>
                ))}
                {values.locations.length > 2 && (
                  <Text
                    style={[
                      styles.pickerMoreText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    + {values.locations.length - 2} more
                  </Text>
                )}
              </View>
            ) : (
              <Text
                style={[styles.pickerPlaceholder, { color: colors.textTertiary }]}
              >
                Add locations to filter
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Salary Range Slider */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Salary Range
          </Text>
          <View
            style={[
              styles.salaryDisplay,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Text style={[styles.salaryText, { color: colors.text }]}>
              ${values.salaryMin.toLocaleString()} - $
              {values.salaryMax.toLocaleString()}
            </Text>
          </View>

          <View style={styles.sliderContainer}>
            <Text
              style={[styles.sliderLabel, { color: colors.textSecondary }]}
            >
              Min: ${values.salaryMin.toLocaleString()}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={300000}
              step={10000}
              value={values.salaryMin}
              onValueChange={(value) =>
                onChange({ ...values, salaryMin: value })
              }
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>

          <View style={styles.sliderContainer}>
            <Text
              style={[styles.sliderLabel, { color: colors.textSecondary }]}
            >
              Max: ${values.salaryMax.toLocaleString()}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={500000}
              step={10000}
              value={values.salaryMax}
              onValueChange={(value) =>
                onChange({ ...values, salaryMax: value })
              }
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>
        </View>

        {renderChipGroup("Job Type", JOB_TYPES, values.jobTypes, "jobTypes")}
        {renderChipGroup(
          "Work Mode",
          WORK_MODES,
          values.workModes,
          "workModes"
        )}
        {renderChipGroup(
          "Experience Level",
          EXPERIENCE_LEVELS,
          values.experienceLevels,
          "experienceLevels"
        )}

        {/* Toggle Filters */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Additional Filters
          </Text>

          {/* Remote Only */}
          <View style={[styles.toggleRow, { borderColor: colors.border }]}>
            <View style={styles.toggleInfo}>
              <Ionicons
                name="globe-outline"
                size={22}
                color={colors.primary}
              />
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  Remote Only
                </Text>
                <Text
                  style={[
                    styles.toggleDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Show only remote positions
                </Text>
              </View>
            </View>
            <Switch
              value={values.remoteOnly}
              onValueChange={(value) =>
                onChange({ ...values, remoteOnly: value })
              }
              trackColor={{
                false: colors.border,
                true: colors.primary + "80",
              }}
              thumbColor={
                values.remoteOnly ? colors.primary : colors.surfaceSecondary
              }
            />
          </View>

          {/* Visa Sponsorship */}
          <View
            style={[
              styles.toggleRow,
              { borderColor: colors.border, borderBottomWidth: 0 },
            ]}
          >
            <View style={styles.toggleInfo}>
              <Ionicons
                name="airplane-outline"
                size={22}
                color={colors.secondary}
              />
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  Visa Sponsorship
                </Text>
                <Text
                  style={[
                    styles.toggleDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Companies willing to sponsor visas
                </Text>
              </View>
            </View>
            <Switch
              value={values.visaSponsorship}
              onValueChange={(value) =>
                onChange({ ...values, visaSponsorship: value })
              }
              trackColor={{
                false: colors.border,
                true: colors.secondary + "80",
              }}
              thumbColor={
                values.visaSponsorship
                  ? colors.secondary
                  : colors.surfaceSecondary
              }
            />
          </View>
        </View>

        {/* Bottom padding for scroll */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Job Titles Picker Modal */}
      <JobTitlesPickerModal
        visible={showJobTitlesPicker}
        onClose={() => setShowJobTitlesPicker(false)}
        selectedTitles={values.jobTitles}
        onTitlesChange={(titles) =>
          onChange({ ...values, jobTitles: titles })
        }
      />

      {/* Locations Picker Modal */}
      <LocationsPickerModal
        visible={showLocationsPicker}
        onClose={() => setShowLocationsPicker(false)}
        selectedLocations={values.locations}
        onLocationsChange={(locations) =>
          onChange({ ...values, locations })
        }
      />
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing[4],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[4],
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
  },
  resetText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
  },
  countBadge: {
    fontSize: typography.fontSize.base,
    fontWeight: "500",
  },
  pickerButton: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minHeight: 56,
    justifyContent: "center",
  },
  pickerContent: {
    gap: 4,
  },
  pickerMainText: {
    fontSize: typography.fontSize.base,
    fontWeight: "500",
  },
  pickerSecondaryText: {
    fontSize: typography.fontSize.base,
  },
  pickerMoreText: {
    fontSize: typography.fontSize.sm,
    marginTop: 4,
  },
  pickerPlaceholder: {
    fontSize: typography.fontSize.base,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  chip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
  },
  salaryDisplay: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
  },
  salaryText: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
    textAlign: "center",
  },
  sliderContainer: {
    marginBottom: spacing[3],
  },
  sliderLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[1],
  },
  slider: {
    width: "100%",
    height: 40,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing[3],
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  toggleDescription: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
});

export default JobPreferencesForm;
