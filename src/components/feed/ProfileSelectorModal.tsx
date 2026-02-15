import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../ui/Text";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { BottomSheet } from "../ui/BottomSheet";

interface Profile {
  id: string;
  name: string;
  headline?: string;
  isComplete: boolean;
}

export interface ResumeSettings {
  useTailoredResume: boolean;
  resumeType: "pdf" | "docx" | null;
  resumeTemplate: string | null;
}

export interface ProfileSelection {
  profile: Profile;
  resumeSettings: ResumeSettings;
}

interface ProfileSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (selection: ProfileSelection) => void;
  selectedProfileId?: string;
  profiles: Profile[];
  initialResumeSettings?: ResumeSettings;
}

export const ProfileSelectorModal: React.FC<ProfileSelectorModalProps> = ({
  visible,
  onClose,
  onSelect,
  selectedProfileId,
  profiles,
  initialResumeSettings,
}) => {
  const { colors } = useTheme();
  const [selected, setSelected] = useState(
    selectedProfileId || profiles[0]?.id,
  );

  // Tailored resume state - initialize from props if provided
  const [useTailoredResume, setUseTailoredResume] = useState(
    initialResumeSettings?.useTailoredResume ?? false
  );
  const [resumeType, setResumeType] = useState<"pdf" | "docx" | null>(
    initialResumeSettings?.resumeType ?? null
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    initialResumeSettings?.resumeTemplate ?? null
  );

  // Template options
  const pdfTemplates = ["Jake", "Harvard"];
  const docxTemplates = [
    "Aether",
    "Eclipse",
    "Eon",
    "Exoplanet",
    "Galaxy",
    "Nova",
    "Solstice",
  ];
  const handleSelect = (profile: Profile) => {
    setSelected(profile.id);
  };

  const handleConfirm = () => {
    const profile = profiles.find((p) => p.id === selected);
    if (profile) {
      onSelect({
        profile,
        resumeSettings: {
          useTailoredResume,
          resumeType,
          resumeTemplate: selectedTemplate,
        },
      });
    }
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      maxHeight="90%"
      title="Select Profile"
    >
      {/* Description */}
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Choose which profile to use when applying to jobs. Your selected
        profile's information will be auto-filled in applications.
      </Text>

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

        {/* Tailored Resume Section */}
        <View style={[styles.tailoredSection, { borderTopColor: colors.border }]}>
          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => {
              setUseTailoredResume(!useTailoredResume);
              if (useTailoredResume) {
                setResumeType(null);
                setSelectedTemplate(null);
              }
            }}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: useTailoredResume
                    ? colors.primary
                    : colors.border,
                  backgroundColor: useTailoredResume
                    ? colors.primary
                    : "transparent",
                },
              ]}
            >
              {useTailoredResume && (
                <Ionicons name="checkmark" size={14} color="#FFF" />
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              Use Tailored Resume
            </Text>
          </TouchableOpacity>

          {/* Resume Type Selection */}
          {useTailoredResume && (
            <View style={styles.resumeTypeSection}>
              <Text
                style={[styles.sectionLabel, { color: colors.textSecondary }]}
              >
                Resume Type
              </Text>
              <View style={styles.typePillsRow}>
                <TouchableOpacity
                  style={[
                    styles.typePill,
                    {
                      backgroundColor:
                        resumeType === "pdf"
                          ? colors.primary
                          : colors.surface,
                      borderColor:
                        resumeType === "pdf" ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setResumeType("pdf");
                    setSelectedTemplate(null);
                  }}
                >
                  <Ionicons
                    name="document-text"
                    size={16}
                    color={resumeType === "pdf" ? "#FFF" : colors.text}
                  />
                  <Text
                    style={[
                      styles.typePillText,
                      { color: resumeType === "pdf" ? "#FFF" : colors.text },
                    ]}
                  >
                    PDF
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typePill,
                    {
                      backgroundColor:
                        resumeType === "docx"
                          ? colors.primary
                          : colors.surface,
                      borderColor:
                        resumeType === "docx"
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setResumeType("docx");
                    setSelectedTemplate(null);
                  }}
                >
                  <Ionicons
                    name="document"
                    size={16}
                    color={resumeType === "docx" ? "#FFF" : colors.text}
                  />
                  <Text
                    style={[
                      styles.typePillText,
                      { color: resumeType === "docx" ? "#FFF" : colors.text },
                    ]}
                  >
                    DOCX
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Template Selection */}
          {useTailoredResume && resumeType && (
            <View style={styles.templateSection}>
              <Text
                style={[styles.sectionLabel, { color: colors.textSecondary }]}
              >
                Select Template
              </Text>
              <View style={styles.templateGrid}>
                {(resumeType === "pdf" ? pdfTemplates : docxTemplates).map(
                  (template) => (
                    <TouchableOpacity
                      key={template}
                      style={[
                        styles.templateCard,
                        {
                          backgroundColor:
                            selectedTemplate === template
                              ? colors.primary + "15"
                              : colors.surface,
                          borderColor:
                            selectedTemplate === template
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedTemplate(template)}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={24}
                        color={
                          selectedTemplate === template
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.templateName,
                          {
                            color:
                              selectedTemplate === template
                                ? colors.primary
                                : colors.text,
                          },
                        ]}
                      >
                        {template}
                      </Text>
                      {selectedTemplate === template && (
                        <View
                          style={[
                            styles.templateCheck,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>
          )}
        </View>
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
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  content: {
    flex: 1,
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
    paddingTop: spacing[4],
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
  // Tailored Resume Styles
  tailoredSection: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  resumeTypeSection: {
    marginTop: spacing[4],
  },
  sectionLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
    marginBottom: spacing[2],
  },
  typePillsRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  templateSection: {
    marginTop: spacing[4],
  },
  templateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  templateCard: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing[2],
    position: "relative",
  },
  templateName: {
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
    marginTop: spacing[1],
    textAlign: "center",
  },
  templateCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
});
