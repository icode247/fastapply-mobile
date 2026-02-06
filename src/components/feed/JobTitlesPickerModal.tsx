import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../ui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { filterJobTitles } from "../../constants/jobTitles";
import { useTheme } from "../../hooks";

interface JobTitlesPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTitles: string[];
  onTitlesChange: (titles: string[]) => void;
  maxTitles?: number;
}

export const JobTitlesPickerModal: React.FC<JobTitlesPickerModalProps> = ({
  visible,
  onClose,
  selectedTitles,
  onTitlesChange,
  maxTitles = 10,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [inputValue, setInputValue] = useState("");

  const selectedSet = useMemo(
    () => new Set(selectedTitles.map((t) => t.toLowerCase())),
    [selectedTitles],
  );

  const suggestions = useMemo(() => {
    const results = filterJobTitles(inputValue);
    return results.filter((title) => !selectedSet.has(title.toLowerCase()));
  }, [inputValue, selectedSet]);

  const addTitle = useCallback(
    (name?: string) => {
      const trimmed = (name || inputValue).trim();
      if (
        trimmed &&
        !selectedSet.has(trimmed.toLowerCase()) &&
        selectedTitles.length < maxTitles
      ) {
        onTitlesChange([...selectedTitles, trimmed]);
        setInputValue("");
      }
    },
    [inputValue, selectedTitles, maxTitles, selectedSet, onTitlesChange],
  );

  const removeTitle = (title: string) => {
    onTitlesChange(selectedTitles.filter((t) => t !== title));
  };

  const hasSuggestions = suggestions.length > 0;

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
                maxHeight: hasSuggestions ? "75%" : "60%",
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
                Job Titles
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
                  placeholder="Search job titles"
                  placeholderTextColor={colors.textTertiary}
                  value={inputValue}
                  onChangeText={setInputValue}
                  onSubmitEditing={() => addTitle()}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => addTitle()}
                  style={[styles.addButton, { backgroundColor: colors.success }]}
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
                contentContainerStyle={styles.suggestionsContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.suggestionItem,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => addTitle(item)}
                  >
                    <Ionicons
                      name="briefcase-outline"
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
                {selectedTitles.length}/{maxTitles} job titles
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
              {selectedTitles.map((title) => (
                <View
                  key={title}
                  style={[
                    styles.listItem,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                >
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: colors.text }]}>
                      {title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeTitle(title)}
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
  suggestionsContainer: {
    maxHeight: 200,
  },
  suggestionsContent: {
    paddingHorizontal: spacing[5],
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
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[2],
    paddingTop: spacing[2],
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

export default JobTitlesPickerModal;
