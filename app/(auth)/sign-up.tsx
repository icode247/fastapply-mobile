import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { Text } from "../../src/components/ui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { uiScale } from "../../src/constants/theme";
import { getApiErrorMessage } from "../../src/services/api";
import { authService } from "../../src/services/auth.service";
import { googleSignIn, googleSignOut } from "../../src/services/google-auth";
import { useAuth } from "../../src/hooks/useAuth";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Input Field Component matching Figma design
const InputField: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  textContentType?: "emailAddress" | "name" | "none";
}> = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "none",
  autoCorrect = false,
  textContentType = "none",
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputFieldContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoComplete={keyboardType === "email-address" ? "email" : "off"}
          textContentType={textContentType}
          selectionColor="rgba(255,255,255,0.5)"
          cursorColor="#FFFFFF"
          returnKeyType="done"
          enablesReturnKeyAutomatically
        />
      </View>
    </View>
  );
};

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

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { handleGoogleCallback } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleSignUp = async () => {
    if (!name || !email) return;
    setLoading(true);

    try {
      await authService.register({
        name,
        email,
        referralCode,
        device: "mobile",
      });
      router.push({ pathname: "/(auth)/verify", params: { email } });
    } catch (error) {
      Alert.alert("Error", getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);

    try {
      const serverAuthCode = await googleSignIn();
      if (!serverAuthCode) {
        // User cancelled
        return;
      }

      const result = await handleGoogleCallback(serverAuthCode);
      if (!result.success) {
        await googleSignOut();
        Alert.alert("Error", result.error || "Google sign-up failed");
      }
    } catch (err) {
      await googleSignOut();
      Alert.alert("Error", getApiErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background gradient matching Figma: 173deg */}
      <LinearGradient
        colors={["#1263B2", "#0D4982", "#082A4C"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 12 },
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
            <GradientText>Let's Get Started</GradientText>
            <Text style={styles.subtitle}>
              Enter your details to create an account
            </Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            {/* Input Fields */}
            <View style={styles.inputsContainer}>
              <InputField
                label="Full Name"
                placeholder="e.g John Doe"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                textContentType="name"
              />

              <InputField
                label="Email address"
                placeholder="example@gmail.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
              />

              <InputField
                label="Referral code (optional)"
                placeholder="e.g JCRxwe1"
                value={referralCode}
                onChangeText={setReferralCode}
              />
            </View>

            {/* Terms Text */}
            <Text style={styles.termsText}>
              <Text style={styles.termsTextLight}>
                By creating an account, you agree to our{" "}
              </Text>
              <Text style={styles.termsLink}>Terms of Service</Text>
              <Text style={styles.termsTextLight}> and </Text>
              <Text style={styles.termsLinkBold}>Privacy Policy</Text>
            </Text>

            {/* Create Account Button */}
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={handleSignUp}
              activeOpacity={0.9}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingDot} />
                  <View style={[styles.loadingDot, { opacity: 0.7 }]} />
                  <View style={[styles.loadingDot, { opacity: 0.4 }]} />
                </View>
              ) : (
                <Text style={styles.createAccountButtonText}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          <Animated.View
            style={[
              styles.dividerContainer,
              {
                opacity: fadeIn,
              },
            ]}
          >
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Continue with Google Button */}
          <Animated.View
            style={[
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.googleButton, googleLoading && { opacity: 0.7 }]}
              onPress={handleGoogleSignUp}
              activeOpacity={0.9}
              disabled={googleLoading || loading}
            >
              <Image
                source={require("../../assets/icons/g-icon.png")}
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={styles.googleButtonText}>
                {googleLoading ? "Signing up..." : "Continue with Google"}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer - Already have an account */}
          <Animated.View
            style={[
              styles.footer,
              {
                opacity: fadeIn,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <Text style={styles.footerText}>
              <Text style={styles.footerTextLight}>
                Already have an account?{" "}
              </Text>
              <Text
                style={styles.footerLink}
                onPress={() => router.push("/(auth)/sign-in")}
              >
                Sign in
              </Text>
            </Text>
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
    marginBottom: 16,
  },
  title: {
    fontSize: Math.round(40 * uiScale),
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: Math.round(48 * uiScale),
  },
  subtitle: {
    fontSize: Math.round(14 * uiScale),
    color: "#FFFFFF",
    lineHeight: Math.round(22 * uiScale),
    marginTop: 4,
  },
  // Form Card
  formCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    gap: 32,
  },
  inputsContainer: {
    gap: 12,
  },
  // Input Field
  inputFieldContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: Math.round(14 * uiScale),
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
    lineHeight: Math.round(20 * uiScale),
  },
  inputContainer: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputContainerFocused: {
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  input: {
    fontSize: Math.round(16 * uiScale),
    color: "#FFFFFF",
    lineHeight: Math.round(22 * uiScale),
    padding: 0,
    margin: 0,
    ...(Platform.OS === "android" ? { includeFontPadding: false, textAlignVertical: "center" as const } : {}),
  },
  // Terms
  termsText: {
    fontSize: Math.round(12 * uiScale),
    lineHeight: Math.round(22 * uiScale),
  },
  termsTextLight: {
    color: "rgba(255,255,255,0.6)",
  },
  termsLink: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  termsLinkBold: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "700",
  },
  // Create Account Button
  createAccountButton: {
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
  createAccountButtonText: {
    fontSize: Math.round(16 * uiScale),
    fontWeight: "600",
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
  // Divider
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 7,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 1000,
  },
  dividerText: {
    fontSize: Math.round(14 * uiScale),
    color: "rgba(255,255,255,0.2)",
    lineHeight: Math.round(22 * uiScale),
  },
  // Google Button
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D4982",
    borderRadius: 100,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  googleIcon: {
    width: Math.round(24 * uiScale),
    height: Math.round(24 * uiScale),
  },
  googleButtonText: {
    fontSize: Math.round(16 * uiScale),
    fontWeight: "500",
    color: "#FFFFFF",
  },
  // Footer
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: Math.round(14 * uiScale),
    lineHeight: Math.round(22 * uiScale),
    textAlign: "center",
  },
  footerTextLight: {
    color: "rgba(255,255,255,0.7)",
  },
  footerLink: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
