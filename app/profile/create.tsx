import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../src/components/ui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  Card,
  DemographicsSection,
  EducationSection,
  ExperienceSection,
  PersonalSection,
  PreferencesSection,
  ProfessionalSection,
} from "../../src/components";
import { spacing, typography } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { profileService, resumeParserService } from "../../src/services";
import {
  CreateJobProfileDto,
  Demographics,
  JobPreferences,
} from "../../src/types";

const STEPS = [
  "Upload",
  "Personal",
  "Professional",
  "Education",
  "Experience",
  "Preferences",
  "Demographics",
];

export default function CreateProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [resumeFile, setResumeFile] = useState<any>(null);

  const [formData, setFormData] = useState<CreateJobProfileDto>({
    name: "",
    skills: [],
    experience: [],
    education: [],
  });

  // Separate states for complex objects not directly on partial DTO
  const [skillsInput, setSkillsInput] = useState("");
  const [preferences, setPreferences] = useState<JobPreferences>({});
  const [demographics, setDemographics] = useState<Demographics>({});

  const updateFormData = (field: keyof CreateJobProfileDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setResumeFile(file);
      setIsParsing(true);

      try {
        const parsedData = await resumeParserService.parseResume({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "application/pdf",
          file: (file as any).file, // Web only - actual File object
        });

        if (parsedData.success && parsedData.data) {
          const data = parsedData.data;
          setFormData((prev) => ({
            ...prev,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            headline: data.headline || prev.headline,
            summary: data.summary || prev.summary,
            currentCity: data.currentCity,
            yearsOfExperience: data.yearsOfExperience || prev.yearsOfExperience,
            skills: data.skills || prev.skills,
            linkedinURL: data.linkedinURL || prev.linkedinURL,
            experience: data.experience || [],
            education: data.education || [],
          }));

          if (data.skills) {
            setSkillsInput(data.skills.join(", "));
          }
          if (data.headline && !formData.name) {
            setFormData((prev) => ({
              ...prev,
              name: data.headline || "New Profile",
            }));
          }
        }
      } catch (error) {
        console.error("Parse error:", error);
        Alert.alert(
          "Notice",
          "Could not auto-parse resume completely. Please fill in details manually."
        );
      } finally {
        setIsParsing(false);
        // Advance to Personal step after parsing attempt
        setCurrentStep(1);
      }
    } catch (err) {
      console.error("Picker error:", err);
      setIsParsing(false);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      // Validation before next?
      if (currentStep === 1 && !formData.name) {
        Alert.alert(
          "Required",
          "Please provide a Profile Name (e.g. Frontend Dev)"
        );
        return;
      }
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Final preparation
      const currentSkills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: CreateJobProfileDto = {
        ...formData,
        skills: currentSkills,
        // NOTE: preferences and demographics are not yet supported by the backend API
        // They are stored in frontend state for future use
      };

      const newProfile = await profileService.createProfile(payload);

      if (resumeFile && newProfile.id) {
        await profileService.uploadResume(newProfile.id, {
          uri: resumeFile.uri,
          name: resumeFile.name,
          type: resumeFile.mimeType || "application/pdf",
          file: (resumeFile as any).file, // Web only - actual File object
        });
      }

      Alert.alert("Success", "Profile created successfully!");
      router.back();
    } catch (error) {
      console.error("Create profile error:", error);
      Alert.alert("Error", "Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Upload
        return (
          <View>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
              Start by uploading your resume to auto-fill your profile.
            </Text>
            <Card style={styles.uploadCard} variant="outlined">
              <View style={styles.uploadContent}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <Ionicons
                    name="cloud-upload-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.uploadTitle, { color: colors.text }]}>
                    {resumeFile ? "Resume Selected" : "Upload Resume"}
                  </Text>
                  <Text
                    style={[
                      styles.uploadSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {resumeFile ? resumeFile.name : "Supported: PDF, DOCX"}
                  </Text>
                </View>
                <Button
                  title={resumeFile ? "Change" : "Upload"}
                  size="sm"
                  variant="secondary"
                  onPress={pickResume}
                  loading={isParsing}
                />
              </View>
            </Card>
            <Button
              title="Skip to Manual Entry"
              variant="ghost"
              onPress={() => setCurrentStep(1)}
            />
          </View>
        );
      case 1: // Personal
        return (
          <View>
            {/* Profile Name is crucial, so we keep it here or inside PersonalSection, preferably passed in */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Profile Name *
            </Text>
            <View style={{ marginBottom: 16 }}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TouchableOpacity style={{ flex: 1, padding: 12 }}>
                  {/* Reusing Input would be better but just ensuring it's at top */}
                  <Text style={{ display: "none" }}>Hidden</Text>
                </TouchableOpacity>
              </View>
              {/* Actually let's just use the Input component above PersonalSection */}
            </View>

            <PersonalSection formData={formData} onChange={updateFormData} />
          </View>
        );
      case 2: // Professional
        return (
          <ProfessionalSection
            formData={formData}
            onChange={updateFormData}
            skillsInput={skillsInput}
            setSkillsInput={setSkillsInput}
          />
        );
      case 3: // Education
        return (
          <EducationSection
            education={formData.education || []}
            onChange={(edu) => updateFormData("education", edu)}
          />
        );
      case 4: // Experience
        return (
          <ExperienceSection
            experience={formData.experience || []}
            onChange={(exp) => updateFormData("experience", exp)}
          />
        );
      case 5: // Preferences
        return (
          <PreferencesSection
            preferences={preferences}
            onChange={setPreferences}
            workAuthorization={formData.workAuthorization}
            requiresSponsorship={formData.requiresSponsorship}
            onAuthChange={(field, val) => updateFormData(field, val)}
          />
        );
      case 6: // Demographics
        return (
          <DemographicsSection
            demographics={demographics}
            onChange={setDemographics}
          />
        );
      default:
        return null;
    }
  };

  // Custom render for Personal step to include Profile Name input which is top level
  const renderContent = () => {
    if (currentStep === 1) {
      return (
        <View>
          <View style={{ marginBottom: 20 }}>
            <Text
              style={[
                styles.label,
                { color: colors.text, fontWeight: "bold", marginBottom: 5 },
              ]}
            >
              Profile Name (Required)
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                backgroundColor: colors.surface,
              }}
            >
              <TouchableOpacity onPress={() => {}}>
                <Text style={{ color: colors.text }}>
                  {formData.name || ""}
                </Text>
                {/* ^ This is just a placeholder, we need a real input */}
              </TouchableOpacity>
              {/* Replacing with real Input component */}
            </View>
          </View>

          {/* Real Input */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}
            >
              Profile Alias / Name
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 10,
              }}
            >
              <TouchableOpacity>
                {/* Using standard TextInput would be better here if Input component has issues, but trying to use same style */}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    return renderStep();
  };

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
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {currentStep === 0 ? "Create Profile" : STEPS[currentStep]}
        </Text>
        <Text style={[styles.stepIndicator, { color: colors.textTertiary }]}>
          {currentStep + 1} / {STEPS.length}
        </Text>
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
          {/* Step 0: Upload */}
          {currentStep === 0 && (
            <View>
              <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                Upload your resume to automatically fill in details.
              </Text>
              <Card style={styles.uploadCard} variant="outlined">
                <View style={styles.uploadContent}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.uploadTitle, { color: colors.text }]}>
                      {resumeFile ? "Resume Selected" : "Upload Resume"}
                    </Text>
                    <Text
                      style={[
                        styles.uploadSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {resumeFile ? resumeFile.name : "PDF, DOCX supported"}
                    </Text>
                  </View>
                  <Button
                    title={resumeFile ? "Change" : "Upload"}
                    size="sm"
                    variant="secondary"
                    onPress={pickResume}
                    loading={isParsing}
                  />
                </View>
              </Card>
              <Button
                title="Skip Upload"
                variant="ghost"
                onPress={() => setCurrentStep(1)}
              />
            </View>
          )}

          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <View>
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Profile Name *
                </Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(text) => updateFormData("name", text)}
                  placeholder="e.g. Frontend Developer Profile"
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    height: 50,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    backgroundColor: colors.surface,
                    color: colors.text,
                    fontSize: 16,
                  }}
                />
              </View>
              <PersonalSection formData={formData} onChange={updateFormData} />
            </View>
          )}

          {/* Step 2: Professional */}
          {currentStep === 2 && (
            <ProfessionalSection
              formData={formData}
              onChange={updateFormData}
              skillsInput={skillsInput}
              setSkillsInput={setSkillsInput}
            />
          )}

          {/* Step 3: Education */}
          {currentStep === 3 && (
            <EducationSection
              education={formData.education || []}
              onChange={(edu) => updateFormData("education", edu)}
            />
          )}

          {/* Step 4: Experience */}
          {currentStep === 4 && (
            <ExperienceSection
              experience={formData.experience || []}
              onChange={(exp) => updateFormData("experience", exp)}
            />
          )}

          {/* Step 5: Preferences */}
          {currentStep === 5 && (
            <PreferencesSection
              preferences={preferences}
              onChange={setPreferences}
              workAuthorization={formData.workAuthorization}
              requiresSponsorship={formData.requiresSponsorship}
              onAuthChange={(field, val) => updateFormData(field, val)}
            />
          )}

          {/* Step 6: Demographics */}
          {currentStep === 6 && (
            <DemographicsSection
              demographics={demographics}
              onChange={setDemographics}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Footer Navigation */}
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
        {currentStep > 0 && (
          <Button
            title="Back"
            variant="ghost"
            onPress={handlePrev}
            style={{ flex: 1, marginRight: 8 }}
          />
        )}
        <Button
          title={currentStep === STEPS.length - 1 ? "Create Profile" : "Next"}
          onPress={handleNext}
          loading={isLoading}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
  },
  backButton: { marginRight: spacing[4], padding: spacing[1] },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
    flex: 1,
  },
  stepIndicator: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  stepDesc: { marginBottom: 16, lineHeight: 20 },
  uploadCard: { marginBottom: 16 },
  uploadContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadTitle: { fontWeight: "600", marginBottom: 2 },
  uploadSubtitle: { fontSize: 12 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    borderTopWidth: 1,
  },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  inputContainer: { borderWidth: 1, borderRadius: 8, height: 48 },
});
