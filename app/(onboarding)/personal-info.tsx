import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../src/components/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Select } from "../../src/components";
import { spacing, typography } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { useOnboardingStore } from "../../src/stores";
import {
  PersonalInfoFormData,
  personalInfoSchema,
} from "../../src/utils/validators";

const TIMEZONE_OPTIONS = [
  { label: "EST (Eastern Standard Time)", value: "EST" },
  { label: "CST (Central Standard Time)", value: "CST" },
  { label: "MST (Mountain Standard Time)", value: "MST" },
  { label: "PST (Pacific Standard Time)", value: "PST" },
  { label: "AKST (Alaska Standard Time)", value: "AKST" },
  { label: "HST (Hawaii Standard Time)", value: "HST" },
  { label: "GMT (Greenwich Mean Time)", value: "GMT" },
  { label: "CET (Central European Time)", value: "CET" },
  { label: "EET (Eastern European Time)", value: "EET" },
  { label: "GST (Gulf Standard Time)", value: "GST" },
  { label: "IST (India Standard Time)", value: "IST" },
  { label: "SGT (Singapore Time)", value: "SGT" },
  { label: "JST (Japan Standard Time)", value: "JST" },
  { label: "AEST (Australian Eastern Time)", value: "AEST" },
  { label: "NZST (New Zealand Standard Time)", value: "NZST" },
  { label: "None of the time zones listed", value: "other" },
];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    currentStep,
    totalSteps,
    firstName,
    lastName,
    email,
    phoneNumber,
    headline,
    currentCity,
    state,
    country,
    timezone,
    linkedinURL,
    githubURL,
    website,
    updatePersonalInfo,
    nextStep,
    prevStep,
  } = useOnboardingStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName,
      lastName,
      email,
      phoneNumber,
      headline,
      currentCity,
      state,
      country,
      linkedinURL,
      githubURL,
      website,
    },
  });

  const onSubmit = (data: PersonalInfoFormData) => {
    updatePersonalInfo(data);
    nextStep();
    router.push("/(onboarding)/experience");
  };

  const handleBack = () => {
    prevStep();
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>
              Personal Information
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Review and update your personal details
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="First Name"
                      placeholder="John"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.firstName?.message}
                    />
                  )}
                />
              </View>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Last Name"
                      placeholder="Doe"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.lastName?.message}
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="john@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  placeholder="+1 (555) 000-0000"
                  keyboardType="phone-pad"
                  leftIcon="call-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phoneNumber?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="headline"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Professional Headline"
                  placeholder="Senior Software Engineer"
                  leftIcon="briefcase-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  hint="A short description of your role or expertise"
                />
              )}
            />

            <View style={styles.sectionTitle}>
              <Text style={[styles.sectionTitleText, { color: colors.text }]}>
                Location
              </Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="currentCity"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="City"
                      placeholder="San Francisco"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
              </View>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="State"
                      placeholder="CA"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="country"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Country"
                  placeholder="United States"
                  leftIcon="globe-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <Select
              label="Timezone"
              value={timezone}
              options={TIMEZONE_OPTIONS}
              onSelect={(val) => updatePersonalInfo({ timezone: val })}
              placeholder="Select your timezone"
            />

            <View style={styles.sectionTitle}>
              <Text style={[styles.sectionTitleText, { color: colors.text }]}>
                Social Links (Optional)
              </Text>
            </View>

            <Controller
              control={control}
              name="linkedinURL"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="LinkedIn"
                  placeholder="https://linkedin.com/in/johndoe"
                  autoCapitalize="none"
                  leftIcon="logo-linkedin"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.linkedinURL?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="githubURL"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="GitHub"
                  placeholder="https://github.com/johndoe"
                  autoCapitalize="none"
                  leftIcon="logo-github"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.githubURL?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="website"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Personal Website"
                  placeholder="https://johndoe.com"
                  autoCapitalize="none"
                  leftIcon="globe-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.website?.message}
                />
              )}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Continue"
          onPress={handleSubmit(onSubmit)}
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing[2],
    textAlign: "center",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  header: {
    marginBottom: spacing[6],
  },
  backButton: {
    marginBottom: spacing[4],
    marginLeft: -spacing[2],
    padding: spacing[2],
    alignSelf: "flex-start",
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "700",
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
  },
  form: {
    gap: spacing[1],
  },
  row: {
    flexDirection: "row",
    gap: spacing[4],
  },
  halfField: {
    flex: 1,
  },
  sectionTitle: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  sectionTitleText: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
  },
  actions: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
});
