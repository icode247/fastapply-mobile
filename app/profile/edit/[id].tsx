import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../../src/components/ui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  DemographicsSection,
  EducationSection,
  ExperienceSection,
  PersonalSection,
  PreferencesSection,
  ProfessionalSection,
} from "../../../src/components";
import { spacing, typography } from "../../../src/constants/theme";
import { useTheme } from "../../../src/hooks";
import { profileService } from "../../../src/services";
import {
  Demographics,
  JobPreferences,
  UpdateJobProfileDto,
} from "../../../src/types";

export default function EditProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<UpdateJobProfileDto>({});

  // States for complex objects
  const [skillsInput, setSkillsInput] = useState("");
  const [preferences, setPreferences] = useState<JobPreferences>({});
  const [demographics, setDemographics] = useState<Demographics>({});

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      const data = await profileService.getProfile(id);
      setFormData({
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        phoneCountryCode: data.phoneCountryCode,
        streetAddress: data.streetAddress,
        currentCity: data.currentCity,
        state: data.state,
        country: data.country,
        zipcode: data.zipcode,
        headline: data.headline,
        summary: data.summary,
        yearsOfExperience: data.yearsOfExperience,
        linkedinURL: data.linkedinURL,
        githubURL: data.githubURL,
        website: data.website,
        portfolioURL: data.portfolioURL,
        education: data.education || [],
        experience: data.experience || [],
        workAuthorization: data.workAuthorization,
        requiresSponsorship: data.requiresSponsorship,
      });

      if (data.skills) {
        setSkillsInput(data.skills.join(", "));
      }
      if (data.preferences) {
        setPreferences(data.preferences);
      }
      if (data.demographics) {
        setDemographics(data.demographics);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      Alert.alert("Error", "Failed to load profile details");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof UpdateJobProfileDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      Alert.alert("Error", "Profile Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const currentSkills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: UpdateJobProfileDto = {
        ...formData,
        skills: currentSkills,
        // NOTE: preferences and demographics are not yet supported by the backend API
        // They are stored in frontend state for future use
      };

      await profileService.updateProfile(id, payload);

      Alert.alert("Success", "Profile updated successfully!");
      router.back();
    } catch (error) {
      console.error("Update profile error:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing[2],
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{ color: colors.text, fontWeight: "600", marginBottom: 6 }}
            >
              Profile Name
            </Text>
            <View
              style={{
                height: 50,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                justifyContent: "center",
                paddingHorizontal: 12,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ color: colors.text }}>{formData.name}</Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                marginTop: 4,
              }}
            >
              Profile Name cannot be changed here for now.
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            <PersonalSection formData={formData} onChange={updateFormData} />
          </View>

          <View style={styles.sectionContainer}>
            <ProfessionalSection
              formData={formData}
              onChange={updateFormData}
              skillsInput={skillsInput}
              setSkillsInput={setSkillsInput}
            />
          </View>

          <View style={styles.sectionContainer}>
            <EducationSection
              education={formData.education || []}
              onChange={(edu) => updateFormData("education", edu)}
            />
          </View>

          <View style={styles.sectionContainer}>
            <ExperienceSection
              experience={formData.experience || []}
              onChange={(exp) => updateFormData("experience", exp)}
            />
          </View>

          <View style={styles.sectionContainer}>
            <PreferencesSection
              preferences={preferences}
              onChange={setPreferences}
              workAuthorization={formData.workAuthorization}
              requiresSponsorship={formData.requiresSponsorship}
              onAuthChange={(field, val) => updateFormData(field, val)}
            />
          </View>

          <View style={styles.sectionContainer}>
            <DemographicsSection
              demographics={demographics}
              onChange={setDemographics}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Button */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing[4],
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Button
          title="Save Changes"
          onPress={handleSubmit}
          loading={isSaving}
          size="lg"
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing[1],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  sectionContainer: {
    marginBottom: spacing[4],
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    borderTopWidth: 1,
  },
});
