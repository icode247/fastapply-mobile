import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import {
  DEFAULT_JOB_PREFERENCES,
  JobPreferencesForm,
  JobPreferencesFormValues,
} from "./JobPreferencesForm";
import { LocationItem } from "./LocationsPickerModal";

interface JobFiltersModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: JobFilters) => void;
  initialFilters?: JobFilters;
}

export interface JobFilters extends JobPreferencesFormValues {}

const DEFAULT_FILTERS: JobFilters = DEFAULT_JOB_PREFERENCES;

export const JobFiltersModal: React.FC<JobFiltersModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters = DEFAULT_FILTERS,
}) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<JobFilters>(initialFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

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
            Edit Job Preferences
          </Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.resetText, { color: colors.textSecondary }]}>
              Clear
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content - Reusable Form */}
        <View style={styles.formContainer}>
          <JobPreferencesForm
            values={filters}
            onChange={setFilters}
          />
        </View>

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
  formContainer: {
    flex: 1,
    paddingHorizontal: spacing[5],
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
});

// Export the LocationItem type for use elsewhere
export type { LocationItem };
