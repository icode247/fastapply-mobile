import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../../src/components";
import { borderRadius, spacing, typography } from "../../src/constants/theme";
import { useResumeUpload, useTheme } from "../../src/hooks";
import { useOnboardingStore } from "../../src/stores";

export default function UploadResumeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentStep, totalSteps, nextStep } = useOnboardingStore();
  const {
    resumeFile,
    isParsingResume,
    parseError,
    uploadProgress,
    pickAndParseResume,
    pickResume,
    parseResume,
    clearResume,
  } = useResumeUpload();

  const handleUploadResume = async () => {
    const result = await pickAndParseResume();
    if (result.success) {
      nextStep();
      router.push("/(onboarding)/personal-info");
    }
  };

  const handleSkip = () => {
    nextStep();
    router.push("/(onboarding)/personal-info");
  };

  const handleContinue = () => {
    if (resumeFile && !isParsingResume) {
      parseResume().then((result) => {
        if (result.success) {
          nextStep();
          router.push("/(onboarding)/personal-info");
        }
      });
    }
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

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Upload your resume
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            We'll use AI to extract your information and pre-fill your profile
          </Text>
        </View>

        {/* Upload Area */}
        {!resumeFile ? (
          <TouchableOpacity
            style={[
              styles.uploadArea,
              {
                borderColor: colors.border,
                backgroundColor: colors.surfaceSecondary,
              },
            ]}
            onPress={handleUploadResume}
            disabled={isParsingResume}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={40}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.uploadTitle, { color: colors.text }]}>
              Tap to upload resume
            </Text>
            <Text style={[styles.uploadHint, { color: colors.textSecondary }]}>
              PDF or DOCX, max 5MB
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.fileCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.fileIcon,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="document-text" size={32} color={colors.primary} />
            </View>

            <View style={styles.fileInfo}>
              <Text
                style={[styles.fileName, { color: colors.text }]}
                numberOfLines={1}
              >
                {resumeFile.name}
              </Text>
              {isParsingResume ? (
                <View style={styles.parsingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={[
                      styles.parsingText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Analyzing resume... {uploadProgress}%
                  </Text>
                </View>
              ) : (
                <Text style={[styles.fileStatus, { color: colors.success }]}>
                  Ready to analyze
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={clearResume} disabled={isParsingResume}>
              <Ionicons
                name="close-circle"
                size={24}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Error Message */}
        {parseError && (
          <View
            style={[styles.errorCard, { backgroundColor: colors.error + "10" }]}
          >
            <Ionicons name="warning" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {parseError}
            </Text>
          </View>
        )}

        {/* Benefits */}
        <View style={styles.benefits}>
          <Text style={[styles.benefitsTitle, { color: colors.text }]}>
            Why upload a resume?
          </Text>

          {[
            "Auto-fill your profile in seconds",
            "AI matches you to relevant jobs",
            "One-click apply to hundreds of jobs",
          ].map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.success}
              />
              <Text
                style={[styles.benefitText, { color: colors.textSecondary }]}
              >
                {benefit}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {resumeFile ? (
          <Button
            title="Continue"
            onPress={handleContinue}
            loading={isParsingResume}
            fullWidth
            size="lg"
          />
        ) : (
          <Button
            title="Upload Resume"
            onPress={handleUploadResume}
            loading={isParsingResume}
            fullWidth
            size="lg"
          />
        )}

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip for now
          </Text>
        </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
  },
  header: {
    marginBottom: spacing[8],
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "700",
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: borderRadius.xl,
    padding: spacing[8],
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  uploadTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    marginBottom: spacing[1],
  },
  uploadHint: {
    fontSize: typography.fontSize.sm,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing[3],
  },
  fileIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    marginBottom: spacing[1],
  },
  fileStatus: {
    fontSize: typography.fontSize.sm,
  },
  parsingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  parsingText: {
    fontSize: typography.fontSize.sm,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginTop: spacing[4],
    gap: spacing[2],
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  benefits: {
    marginTop: spacing[8],
  },
  benefitsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    marginBottom: spacing[4],
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  benefitText: {
    fontSize: typography.fontSize.base,
  },
  actions: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  skipButton: {
    alignSelf: "center",
    paddingVertical: spacing[4],
  },
  skipText: {
    fontSize: typography.fontSize.base,
  },
});
