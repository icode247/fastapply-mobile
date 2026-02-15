import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../ui/Text";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { filterCities } from "../../constants/cities";
import { useTheme } from "../../hooks";
import { BottomSheet } from "../ui/BottomSheet";

export interface LocationItem {
  id: string;
  name: string;
}

interface LocationsPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedLocations: LocationItem[];
  onLocationsChange: (locations: LocationItem[]) => void;
  maxLocations?: number;
}

export const LocationsPickerModal: React.FC<LocationsPickerModalProps> = ({
  visible,
  onClose,
  selectedLocations,
  onLocationsChange,
  maxLocations = 5,
}) => {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState("");

  const selectedIds = useMemo(
    () => new Set(selectedLocations.map((l) => l.id)),
    [selectedLocations],
  );

  const suggestions = useMemo(() => {
    const results = filterCities(inputValue);
    return results.filter(
      (city) => !selectedIds.has(city.toLowerCase().replace(/\s+/g, "-")),
    );
  }, [inputValue, selectedIds]);

  const addLocation = useCallback(
    (name?: string) => {
      const trimmed = (name || inputValue).trim();
      if (trimmed && selectedLocations.length < maxLocations) {
        const id = trimmed.toLowerCase().replace(/\s+/g, "-");
        if (!selectedIds.has(id)) {
          onLocationsChange([...selectedLocations, { id, name: trimmed }]);
          setInputValue("");
        }
      }
    },
    [inputValue, selectedLocations, maxLocations, selectedIds, onLocationsChange],
  );

  const removeLocation = (id: string) => {
    onLocationsChange(selectedLocations.filter((l) => l.id !== id));
  };

  const hasSuggestions = suggestions.length > 0;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      maxHeight={hasSuggestions ? "75%" : "60%"}
      showCloseButton={false}
      title="Locations"
    >
      {/* Search Input */}
      <View style={styles.inputContainer}>
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={colors.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Search locations"
            placeholderTextColor={colors.textTertiary}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={() => addLocation()}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={() => addLocation()}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            disabled={!inputValue.trim()}
          >
            <Ionicons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Autocomplete Suggestions */}
      {hasSuggestions && (
        <FlatList
          data={suggestions}
          keyExtractor={(item, index) => `${index}-${item}`}
          keyboardShouldPersistTaps="handled"
          style={styles.suggestionsContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.suggestionItem,
                { borderBottomColor: colors.border },
              ]}
              onPress={() => addLocation(item)}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color={colors.textSecondary}
                style={styles.suggestionIcon}
              />
              <Text
                style={[
                  styles.suggestionText,
                  { color: colors.text },
                ]}
                numberOfLines={1}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Counter */}
      <View style={styles.counterContainer}>
        <Text style={[styles.counterText, { color: colors.textSecondary }]}>
          {selectedLocations.length}/{maxLocations} locations
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Selected Items */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {selectedLocations.map((item) => (
          <View
            key={item.id}
            style={[
              styles.listItem,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <View style={styles.listItemContent}>
              <Text style={[styles.listItemTitle, { color: colors.text }]}>
                {item.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => removeLocation(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    paddingBottom: spacing[3],
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    paddingLeft: spacing[3],
    paddingRight: spacing[1],
    paddingVertical: spacing[1],
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing[2],
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionsContainer: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionIcon: {
    marginRight: spacing[3],
  },
  suggestionText: {
    fontSize: typography.fontSize.base,
    flex: 1,
  },
  counterContainer: {
    paddingBottom: spacing[2],
    paddingTop: spacing[2],
  },
  counterText: {
    fontSize: typography.fontSize.sm,
  },
  divider: {
    height: 1,
    marginBottom: spacing[3],
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    gap: spacing[2],
    paddingBottom: spacing[4],
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
});

export default LocationsPickerModal;
