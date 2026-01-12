import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../../src/components";
import { borderRadius, spacing, typography } from "../../src/constants/theme";
import { useAuth, useTheme } from "../../src/hooks";
import { getApiErrorMessage } from "../../src/services/api";

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { verifyMagicLink, verifyOtp } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error"
  >("pending");
  const email = params.email as string | undefined;

  useEffect(() => {
    // Check if we have a token from deep link
    const token = params.token as string | undefined;
    if (token) {
      handleVerification(token);
    }

    // Listen for deep links
    const subscription = Linking.addEventListener("url", (event) => {
      const url = Linking.parse(event.url);
      if (url.queryParams?.token) {
        handleVerification(url.queryParams.token as string);
      }
    });

    return () => subscription.remove();
  }, [params.token]);

  const handleVerification = async (token: string) => {
    setIsVerifying(true);
    try {
      const result = await verifyMagicLink(token);
      if (result.success) {
        setVerificationStatus("success");
      } else {
        setVerificationStatus("error");
        Alert.alert(
          "Verification Failed",
          result.error || "Invalid or expired link"
        );
      }
    } catch (error) {
      setVerificationStatus("error");
      Alert.alert("Error", "Something went wrong during verification");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpVerification = async () => {
    if (!email || !otp) return;
    setIsVerifying(true);
    try {
      await verifyOtp({ email, otp });
      setVerificationStatus("success");
      // Wait a bit to show success state before redirecting
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    } catch (error) {
      setVerificationStatus("error");
      Alert.alert("Verification Failed", getApiErrorMessage(error));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerify = () => {
    if (manualToken) {
      handleVerification(manualToken);
    }
  };

  const handleResendLink = () => {
    router.push("/(auth)/sign-in");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Ionicons
            name={
              verificationStatus === "success"
                ? "checkmark-circle"
                : email
                ? "keypad-outline"
                : "mail-open-outline"
            }
            size={64}
            color={
              verificationStatus === "success" ? colors.success : colors.primary
            }
          />
        </View>

        {/* Title and Description */}
        <Text style={[styles.title, { color: colors.text }]}>
          {isVerifying
            ? "Verifying..."
            : verificationStatus === "success"
            ? "Verified!"
            : email
            ? "Enter Verification Code"
            : "Check your email"}
        </Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {isVerifying
            ? "Please wait while we verify..."
            : verificationStatus === "success"
            ? "Redirecting..."
            : email
            ? `We sent a 6-digit code to ${email}`
            : "We sent you a magic link. Click the link in your email to sign in."}
        </Text>

        {/* OTP Input for Mobile Auth */}
        {email && verificationStatus !== "success" && !isVerifying && (
          <View style={styles.manualInputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                  textAlign: "center",
                  letterSpacing: 4,
                  fontSize: 24,
                  fontWeight: "600",
                },
              ]}
              placeholder="000000"
              placeholderTextColor={colors.textTertiary}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <Button
              title="Verify Code"
              onPress={handleOtpVerification}
              variant="primary"
              disabled={otp.length !== 6}
              loading={isVerifying}
              style={{ marginTop: spacing[4] }}
              fullWidth
            />
          </View>
        )}

        {/* Spam notice (Only show for magic link flow) */}
        {!email && verificationStatus === "pending" && !isVerifying && (
          <View
            style={[
              styles.notice,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              Can't find it? Check your spam folder or request a new link.
            </Text>
          </View>
        )}

        {/* Manual Token Input (Fallback for Magic Link) */}
        {!email && verificationStatus !== "success" && !isVerifying && (
          <View style={styles.manualInputContainer}>
            <Text style={[styles.manualLabel, { color: colors.textSecondary }]}>
              Or enter code manually:
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceSecondary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Enter verification code"
              placeholderTextColor={colors.textTertiary}
              value={manualToken}
              onChangeText={setManualToken}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              title="Verify Code"
              onPress={handleManualVerify}
              variant="primary"
              disabled={!manualToken}
              style={{ marginTop: spacing[2] }}
            />
          </View>
        )}

        {/* Actions */}
        {verificationStatus !== "success" && !isVerifying && (
          <View style={styles.actions}>
            <Button
              title="Resend Code"
              onPress={handleResendLink}
              variant="outline"
              fullWidth
            />

            <TouchableOpacity
              style={styles.helpLink}
              onPress={() =>
                Alert.alert(
                  "Help",
                  "Contact support@fastapply.com for assistance"
                )
              }
            >
              <Text style={[styles.helpText, { color: colors.primary }]}>
                Need help?
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    marginTop: spacing[4],
    marginLeft: spacing[4],
    padding: spacing[2],
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing[6],
  },
  title: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "700",
    marginBottom: spacing[3],
    textAlign: "center",
  },
  description: {
    fontSize: typography.fontSize.base,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
    marginBottom: spacing[6],
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  noticeText: {
    fontSize: typography.fontSize.sm,
    flex: 1,
  },
  actions: {
    width: "100%",
    gap: spacing[4],
  },
  helpLink: {
    alignSelf: "center",
    padding: spacing[2],
  },
  helpText: {
    fontSize: typography.fontSize.base,
    fontWeight: "500",
  },
  manualInputContainer: {
    width: "100%",
    marginBottom: spacing[6],
  },
  manualLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[2],
    textAlign: "center",
  },
  input: {
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    fontSize: 16,
    marginBottom: spacing[2],
  },
});
