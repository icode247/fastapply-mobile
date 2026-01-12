import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";

interface JobFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: JobFilters) => void;
  initialFilters?: JobFilters;
}

export interface JobFilters {
  jobTypes: string[];
  workModes: string[];
  experienceLevels: string[];
  salaryMin: number;
  salaryMax: number;
  country: string | null;
  cities: string[];
  remoteOnly: boolean;
  visaSponsorship: boolean;
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

// Country -> Cities mapping
const COUNTRIES_CITIES: Record<string, string[]> = {
  "United States": [
    "New York",
    "San Francisco",
    "Los Angeles",
    "Austin",
    "Seattle",
    "Chicago",
    "Boston",
    "Denver",
  ],
  "United Kingdom": [
    "London",
    "Manchester",
    "Birmingham",
    "Edinburgh",
    "Bristol",
    "Leeds",
  ],
  Canada: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  Germany: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne"],
  Netherlands: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"],
  Australia: ["Sydney", "Melbourne", "Brisbane", "Perth"],
  Singapore: ["Singapore"],
  Nigeria: ["Lagos", "Abuja", "Port Harcourt", "Ibadan"],
  India: ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai"],
};

const COUNTRIES = Object.keys(COUNTRIES_CITIES);

const DEFAULT_FILTERS: JobFilters = {
  jobTypes: [],
  workModes: [],
  experienceLevels: [],
  salaryMin: 30000,
  salaryMax: 200000,
  country: null,
  cities: [],
  remoteOnly: false,
  visaSponsorship: false,
};

export const JobFiltersModal: React.FC<JobFiltersModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters = DEFAULT_FILTERS,
}) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<JobFilters>(initialFilters);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const toggleArrayItem = (key: keyof JobFilters, item: string) => {
    const arr = filters[key] as string[];
    if (arr.includes(item)) {
      setFilters({ ...filters, [key]: arr.filter((i) => i !== item) });
    } else {
      setFilters({ ...filters, [key]: [...arr, item] });
    }
  };

  const selectCountry = (country: string) => {
    setFilters({ ...filters, country, cities: [] });
    setShowCountryPicker(false);
    setShowCityPicker(false); // Close city picker when country changes
  };

  const toggleCountryPicker = () => {
    setShowCountryPicker(!showCountryPicker);
    if (!showCountryPicker) setShowCityPicker(false); // Close city picker when opening country
  };

  const toggleCityPicker = () => {
    setShowCityPicker(!showCityPicker);
    if (!showCityPicker) setShowCountryPicker(false); // Close country picker when opening city
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const availableCities = filters.country
    ? COUNTRIES_CITIES[filters.country] || []
    : [];

  const renderChipGroup = (
    title: string,
    items: string[],
    selectedItems: string[],
    filterKey: keyof JobFilters
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Job Preferences
          </Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.resetText, { color: colors.primary }]}>
              Reset
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled={true}
        >
          {/* Country Selector - TOP */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Country
            </Text>
            <TouchableOpacity
              style={[
                styles.dropdown,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              onPress={toggleCountryPicker}
            >
              <Text
                style={[
                  styles.dropdownText,
                  {
                    color: filters.country ? colors.text : colors.textTertiary,
                  },
                ]}
              >
                {filters.country || "Select a country"}
              </Text>
              <Ionicons
                name={showCountryPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showCountryPicker && (
              <ScrollView
                style={[
                  styles.dropdownList,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                nestedScrollEnabled={true}
              >
                {COUNTRIES.map((country) => (
                  <TouchableOpacity
                    key={country}
                    style={[
                      styles.dropdownItem,
                      filters.country === country && {
                        backgroundColor: colors.primary + "15",
                      },
                    ]}
                    onPress={() => selectCountry(country)}
                  >
                    <Text
                      style={[styles.dropdownItemText, { color: colors.text }]}
                    >
                      {country}
                    </Text>
                    {filters.country === country && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Cities Multi-Select Dropdown (only show if country is selected) */}
          {filters.country && availableCities.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Cities
              </Text>
              <TouchableOpacity
                style={[
                  styles.dropdown,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={toggleCityPicker}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    {
                      color:
                        filters.cities.length > 0
                          ? colors.text
                          : colors.textTertiary,
                    },
                  ]}
                >
                  {filters.cities.length > 0
                    ? `${filters.cities.length} cities selected`
                    : "Select cities"}
                </Text>
                <Ionicons
                  name={showCityPicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {showCityPicker && (
                <ScrollView
                  style={[
                    styles.dropdownList,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  nestedScrollEnabled={true}
                >
                  {availableCities.map((city) => {
                    const isSelected = filters.cities.includes(city);
                    return (
                      <TouchableOpacity
                        key={city}
                        style={[
                          styles.dropdownItem,
                          isSelected && {
                            backgroundColor: colors.primary + "15",
                          },
                        ]}
                        onPress={() => toggleArrayItem("cities", city)}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: colors.text },
                          ]}
                        >
                          {city}
                        </Text>
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: isSelected
                                ? colors.primary
                                : colors.border,
                              backgroundColor: isSelected
                                ? colors.primary
                                : "transparent",
                            },
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#FFF" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Show selected cities as small chips */}
              {filters.cities.length > 0 && (
                <View style={styles.selectedChipsContainer}>
                  {filters.cities.map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={[
                        styles.selectedChip,
                        { backgroundColor: colors.primary + "20" },
                      ]}
                      onPress={() => toggleArrayItem("cities", city)}
                    >
                      <Text
                        style={[
                          styles.selectedChipText,
                          { color: colors.primary },
                        ]}
                      >
                        {city}
                      </Text>
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

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
                ${filters.salaryMin.toLocaleString()} - $
                {filters.salaryMax.toLocaleString()}
              </Text>
            </View>

            <View style={styles.sliderContainer}>
              <Text
                style={[styles.sliderLabel, { color: colors.textSecondary }]}
              >
                Min: ${filters.salaryMin.toLocaleString()}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={300000}
                step={10000}
                value={filters.salaryMin}
                onValueChange={(value) =>
                  setFilters({ ...filters, salaryMin: value })
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
                Max: ${filters.salaryMax.toLocaleString()}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={500000}
                step={10000}
                value={filters.salaryMax}
                onValueChange={(value) =>
                  setFilters({ ...filters, salaryMax: value })
                }
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
            </View>
          </View>

          {renderChipGroup("Job Type", JOB_TYPES, filters.jobTypes, "jobTypes")}
          {renderChipGroup(
            "Work Mode",
            WORK_MODES,
            filters.workModes,
            "workModes"
          )}
          {renderChipGroup(
            "Experience Level",
            EXPERIENCE_LEVELS,
            filters.experienceLevels,
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
                value={filters.remoteOnly}
                onValueChange={(value) =>
                  setFilters({ ...filters, remoteOnly: value })
                }
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "80",
                }}
                thumbColor={
                  filters.remoteOnly ? colors.primary : colors.surfaceSecondary
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
                value={filters.visaSponsorship}
                onValueChange={(value) =>
                  setFilters({ ...filters, visaSponsorship: value })
                }
                trackColor={{
                  false: colors.border,
                  true: colors.secondary + "80",
                }}
                thumbColor={
                  filters.visaSponsorship
                    ? colors.secondary
                    : colors.surfaceSecondary
                }
              />
            </View>
          </View>

          {/* Bottom padding for scroll */}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Apply Button */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
  },
  resetText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
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
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: typography.fontSize.base,
  },
  dropdownList: {
    marginTop: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  dropdownItemText: {
    fontSize: typography.fontSize.base,
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
  footer: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
  },
  applyButton: {
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#FFF",
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: spacing[3],
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[1],
    paddingLeft: spacing[3],
    paddingRight: spacing[2],
    borderRadius: borderRadius.full,
    gap: spacing[1],
  },
  selectedChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
  },
});
