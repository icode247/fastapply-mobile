import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/hooks";
import { getApiErrorMessage } from "../../src/services/api";

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
    try {
      const result = await verifyMagicLink(token);
      if (!result.success) {
        Alert.alert(
          "Verification Failed",
          result.error || "Invalid or expired link"
        );
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong during verification");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, "");
    if (numericText.length <= 6) {
      setOtp(numericText);
    }
  };

  const handleVerifyCode = async () => {
    if (!email || otp.length !== 6) return;
    setIsVerifying(true);

    try {
      await verifyOtp({ email, otp });
      // Success - will redirect via auth hook
    } catch (error) {
      Alert.alert("Verification Failed", getApiErrorMessage(error));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = () => {
    if (!canResend) return;
    // Reset countdown and trigger resend
    setCountdown(52);
    setCanResend(false);
    // TODO: Call resend API
    router.push("/(auth)/sign-in");
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={["#1263B2", "#0D4982", "#082A4C"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circle */}
      <View style={styles.decorativeCircle} />

      <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
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
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
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
            <Text style={styles.emailText}>{email || "hello@fastapply.co"}</Text>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativeCircle: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: 77,
    left: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // Back Button
  backButtonContainer: {
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
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
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 22,
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
    height: 0,
    width: 0,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  otpBox: {
    width: 48,
    height: 48,
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
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Resend
  resendContainer: {
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    lineHeight: 22,
  },
  resendTextLight: {
    color: "rgba(255,255,255,0.6)",
  },
  resendLink: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  countdownText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 22,
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
    fontSize: 16,
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
