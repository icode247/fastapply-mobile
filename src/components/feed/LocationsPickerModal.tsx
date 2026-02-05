import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";

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
  const insets = useSafeAreaInsets();
  const [inputValue, setInputValue] = useState("");

  const addLocation = () => {
    const trimmed = inputValue.trim();
    if (trimmed && selectedLocations.length < maxLocations) {
      const id = trimmed.toLowerCase().replace(/\s+/g, "-");
      if (!selectedLocations.some((l) => l.id === id)) {
        onLocationsChange([...selectedLocations, { id, name: trimmed }]);
        setInputValue("");
      }
    }
  };

  const removeLocation = (id: string) => {
    onLocationsChange(selectedLocations.filter((l) => l.id !== id));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <Pressable
            style={[
              styles.container,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom + spacing[4],
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View
                style={[styles.handle, { backgroundColor: colors.textTertiary }]}
              />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                <Text style={[styles.doneButton, { color: colors.success }]}>
                  Done
                </Text>
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.text }]}>
                Locations
              </Text>
              <View style={styles.headerButton} />
            </View>

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
                  onSubmitEditing={addLocation}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={addLocation}
                  style={[styles.addButton, { backgroundColor: colors.success }]}
                  disabled={!inputValue.trim()}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

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
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  keyboardView: {
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: 350,
    maxHeight: "60%",
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  headerButton: {
    width: 50,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  doneButton: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  inputContainer: {
    paddingHorizontal: spacing[5],
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
  counterContainer: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[2],
  },
  counterText: {
    fontSize: typography.fontSize.sm,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing[5],
    marginBottom: spacing[3],
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing[5],
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
