import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
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
import { uiScale } from "../../src/constants/theme";
import { useAuth } from "../../src/hooks";
import { getApiErrorMessage } from "../../src/services/api";
import { authService } from "../../src/services/auth.service";

// Gradient Text Component
const GradientText: React.FC<{ children: string; style?: any }> = ({
  children,
  style,
}) => {
  return (
    <MaskedView
      maskElement={<Text style={[styles.title, style]}>{children}</Text>}
    >
      <LinearGradient
        colors={["#FFFFFF", "#B4DBE8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.title, style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

// OTP Input Box Component
const OTPBox: React.FC<{
  value: string;
  isFocused: boolean;
  isFirst: boolean;
}> = ({ value, isFocused, isFirst }) => {
  return (
    <View
      style={[
        styles.otpBox,
        isFocused && styles.otpBoxFocused,
        isFirst && styles.otpBoxFirst,
      ]}
    >
      <Text style={styles.otpText}>{value}</Text>
    </View>
  );
};

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { verifyMagicLink, verifyOtp } = useAuth();

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(52);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const inputRef = useRef<TextInput>(null);
  const email = params.email as string | undefined;

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Check for deep link token
  useEffect(() => {
    const token = params.token as string | undefined;
    if (token) {
      handleMagicLinkVerification(token);
    }

    const subscription = Linking.addEventListener("url", (event) => {
      const url = Linking.parse(event.url);
      if (url.queryParams?.token) {
        handleMagicLinkVerification(url.queryParams.token as string);
      }
    });

    return () => subscription.remove();
  }, [params.token]);

  const handleMagicLinkVerification = async (token: string) => {
    setIsVerifying(true);
    setError("");
    try {
      const result = await verifyMagicLink(token);
      if (!result.success) {
        setError(result.error || "Invalid or expired link");
      }
    } catch (err) {
      setError("Something went wrong during verification");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, "");
    if (numericText.length <= 6) {
      setOtp(numericText);
      if (error) setError("");
      if (successMessage) setSuccessMessage("");
    }
  };

  const handleVerifyCode = async () => {
    if (!email || otp.length !== 6) return;
    setError("");
    setSuccessMessage("");
    setIsVerifying(true);

    const result = await verifyOtp({ email, otp });
    if (!result.success) {
      setError(result.error || "Invalid or expired code. Please try again.");
      setOtp("");
    }
    setIsVerifying(false);
  };

  const handleResendCode = async () => {
    if (!canResend || !email) return;
    setError("");
    setSuccessMessage("");
    setCountdown(52);
    setCanResend(false);
    setOtp("");

    try {
      await authService.signIn({ email, device: "mobile" });
      setSuccessMessage("A new code has been sent to your email");
    } catch (err) {
      setError(getApiErrorMessage(err));
      setCanResend(true);
      setCountdown(0);
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={["#126ba3", "#0E5680", "#0A3F5E"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circle */}
      <View style={[styles.decorativeCircle, { top: insets.top + 20 }]} />

      <KeyboardAvoidingView
        style={[styles.keyboardView, { paddingTop: insets.top }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: 12 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <Animated.View
            style={[
              styles.backButtonContainer,
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={Math.round(20 * uiScale)} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>

          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            <GradientText>Verify Your Email</GradientText>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to your email{"\n"}
              <Text style={styles.emailText}>{email || "hello@scout.co"}</Text>
            </Text>
          </Animated.View>

          {/* OTP Card */}
          <Animated.View
            style={[
              styles.otpCard,
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            {/* Hidden TextInput for keyboard */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />

            {/* OTP Boxes */}
            <TouchableOpacity
              style={styles.otpContainer}
              onPress={focusInput}
              activeOpacity={1}
            >
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <OTPBox
                  key={index}
                  value={otp[index] || ""}
                  isFocused={otp.length === index}
                  isFirst={index === 0}
                />
              ))}
            </TouchableOpacity>

            {/* Error Message */}
            {error ? (
              <View style={styles.messageContainer}>
                <Ionicons name="alert-circle" size={Math.round(16 * uiScale)} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Success Message */}
            {successMessage ? (
              <View style={styles.messageContainer}>
                <Ionicons name="checkmark-circle" size={Math.round(16 * uiScale)} color="#4ADE80" />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Resend Code Text */}
            <View style={styles.resendContainer}>
              {canResend ? (
                <Text style={styles.resendText}>
                  <Text style={styles.resendTextLight}>Didn't get a code? </Text>
                  <Text style={styles.resendLink} onPress={handleResendCode}>
                    Resend Code
                  </Text>
                </Text>
              ) : (
                <Text style={styles.countdownText}>
                  Resend Code in {countdown}s..
                </Text>
              )}
            </View>

            {/* Verify Code Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                otp.length !== 6 && styles.verifyButtonDisabled,
              ]}
              onPress={handleVerifyCode}
              activeOpacity={0.9}
              disabled={otp.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingDot} />
                  <View style={[styles.loadingDot, { opacity: 0.7 }]} />
                  <View style={[styles.loadingDot, { opacity: 0.4 }]} />
                </View>
              ) : (
                <Text style={styles.verifyButtonText}>Verify Code</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  decorativeCircle: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
    left: 8,
  },
  // Back Button
  backButtonContainer: {
    marginBottom: 16,
  },
  backButton: {
    width: Math.round(40 * uiScale),
    height: Math.round(40 * uiScale),
    borderRadius: 1000,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Header
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: Math.round(40 * uiScale),
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: Math.round(44 * uiScale),
  },
  subtitle: {
    fontSize: Math.round(14 * uiScale),
    color: "#FFFFFF",
    lineHeight: Math.round(22 * uiScale),
    marginTop: 8,
  },
  emailText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  // OTP Card
  otpCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    gap: 24,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 1,
    width: 1,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  otpBox: {
    width: Math.round(48 * uiScale),
    height: Math.round(48 * uiScale),
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(208,209,212,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  otpBoxFirst: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  otpBoxFocused: {
    borderColor: "rgba(255,255,255,0.8)",
  },
  otpText: {
    fontSize: Math.round(24 * uiScale),
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Messages
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    fontSize: Math.round(14 * uiScale),
    color: "#FF6B6B",
    flex: 1,
    lineHeight: Math.round(20 * uiScale),
  },
  successText: {
    fontSize: Math.round(14 * uiScale),
    color: "#4ADE80",
    flex: 1,
    lineHeight: Math.round(20 * uiScale),
  },
  // Resend
  resendContainer: {
    alignItems: "center",
  },
  resendText: {
    fontSize: Math.round(14 * uiScale),
    lineHeight: Math.round(22 * uiScale),
  },
  resendTextLight: {
    color: "rgba(255,255,255,0.6)",
  },
  resendLink: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  countdownText: {
    fontSize: Math.round(14 * uiScale),
    color: "rgba(255,255,255,0.6)",
    lineHeight: Math.round(22 * uiScale),
  },
  // Verify Button
  verifyButton: {
    backgroundColor: "#FBFBFB",
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: Math.round(16 * uiScale),
    fontWeight: "500",
    color: "#0D4982",
  },
  loadingContainer: {
    flexDirection: "row",
    gap: 6,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0D4982",
  },
});
