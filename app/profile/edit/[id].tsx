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
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            Edit Profile
          </Text>
        </View>

        <View style={styles.content}>
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
              {/* Manual input simulation for now, relying on explicit TextInputs inside sections mostly */}
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

          <View style={styles.separator} />

          <View style={styles.sectionContainer}>
            <ProfessionalSection
              formData={formData}
              onChange={updateFormData}
              skillsInput={skillsInput}
              setSkillsInput={setSkillsInput}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.sectionContainer}>
            <EducationSection
              education={formData.education || []}
              onChange={(edu) => updateFormData("education", edu)}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.sectionContainer}>
            <ExperienceSection
              experience={formData.experience || []}
              onChange={(exp) => updateFormData("experience", exp)}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.sectionContainer}>
            <PreferencesSection
              preferences={preferences}
              onChange={setPreferences}
              workAuthorization={formData.workAuthorization}
              requiresSponsorship={formData.requiresSponsorship}
              onAuthChange={(field, val) => updateFormData(field, val)}
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.sectionContainer}>
            <DemographicsSection
              demographics={demographics}
              onChange={setDemographics}
            />
          </View>

          <Button
            title="Save Changes"
            onPress={handleSubmit}
            loading={isSaving}
            size="lg"
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  backButton: {
    marginRight: spacing[4],
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: spacing[6],
  },
  sectionContainer: {
    marginBottom: spacing[6],
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB", // Should use colors.border but not available in styles directly
    marginVertical: spacing[6],
  },
  submitButton: {
    marginTop: spacing[2],
  },
});
