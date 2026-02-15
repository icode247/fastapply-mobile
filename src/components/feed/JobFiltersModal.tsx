import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../ui/Text";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import {
  DEFAULT_JOB_PREFERENCES,
  JobPreferencesForm,
  JobPreferencesFormValues,
} from "./JobPreferencesForm";
import { LocationItem } from "./LocationsPickerModal";
import { BottomSheet } from "../ui/BottomSheet";

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

  // Sync local state when modal opens with latest stored preferences
  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      maxHeight="90%"
      title="Edit Job Preferences"
    >
      {/* Clear link */}
      <TouchableOpacity onPress={handleReset} style={styles.clearButton}>
        <Text style={[styles.clearText, { color: colors.textSecondary }]}>
          Clear All
        </Text>
      </TouchableOpacity>

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
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  clearButton: {
    alignSelf: "flex-end",
    marginBottom: spacing[2],
  },
  clearText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  formContainer: {
    flex: 1,
  },
  footer: {
    paddingTop: spacing[4],
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
