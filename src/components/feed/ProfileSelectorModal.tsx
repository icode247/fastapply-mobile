import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";

interface Profile {
  id: string;
  name: string;
  headline?: string;
  isComplete: boolean;
}

interface ProfileSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (profile: Profile) => void;
  selectedProfileId?: string;
  profiles: Profile[];
}

export const ProfileSelectorModal: React.FC<ProfileSelectorModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedProfileId,
  profiles,
}) => {
  const { colors } = useTheme();
  const [selected, setSelected] = useState(
    selectedProfileId || profiles[0]?.id
  );

  const handleSelect = (profile: Profile) => {
    setSelected(profile.id);
  };

  const handleConfirm = () => {
    const profile = profiles.find((p) => p.id === selected);
    if (profile) {
      onSelect(profile);
    }
    onClose();
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
            Select Profile
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Choose which profile to use when applying to jobs. Your selected
            profile's information will be auto-filled in applications.
          </Text>
        </View>

        {/* Profile List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {profiles.map((profile) => {
            const isSelected = selected === profile.id;
            return (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.profileCard,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + "10"
                      : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleSelect(profile)}
              >
                <View style={styles.profileInfo}>
                  <View style={styles.profileHeader}>
                    <Text style={[styles.profileName, { color: colors.text }]}>
                      {profile.name}
                    </Text>
                    {!profile.isComplete && (
                      <View
                        style={[
                          styles.incompleteBadge,
                          { backgroundColor: colors.warning + "20" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.incompleteBadgeText,
                            { color: colors.warning },
                          ]}
                        >
                          Incomplete
                        </Text>
                      </View>
                    )}
                  </View>
                  {profile.headline && (
                    <Text
                      style={[
                        styles.profileHeadline,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {profile.headline}
                    </Text>
                  )}
                </View>

                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected
                        ? colors.primary
                        : "transparent",
                    },
                  ]}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Confirm Button */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>Use This Profile</Text>
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
  descriptionContainer: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[5],
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    marginBottom: spacing[3],
  },
  profileInfo: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: 4,
  },
  profileName: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
  },
  incompleteBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  incompleteBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
  },
  profileHeadline: {
    fontSize: typography.fontSize.sm,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
  },
  confirmButton: {
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFF",
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
  },
});
