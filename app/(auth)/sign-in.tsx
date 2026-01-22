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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getApiErrorMessage } from "../../src/services/api";
import { authService } from "../../src/services/auth.service";

// Input Field Component
const InputField: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}> = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "none",
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
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
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

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSignIn = async () => {
    if (!email) return;
    setLoading(true);

    try {
      await authService.signIn({ email, device: "mobile" });
      router.push({ pathname: "/(auth)/verify", params: { email } });
    } catch (error) {
      Alert.alert("Error", getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Google sign in
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

      {/* Decorative circle */}
      <View style={styles.decorativeCircle} />

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
            <GradientText>Welcome Back</GradientText>
            <Text style={styles.subtitle}>
              A verification code will be sent to your email to access your
              account
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
            <InputField
              label="Email address"
              placeholder="example@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Animated.View>

          {/* Spacer to push buttons to bottom */}
          <View style={styles.spacer} />

          {/* Sign In Button */}
          <Animated.View
            style={[
              {
                opacity: fadeIn,
                transform: [{ translateY: slideUp }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
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
                <Text style={styles.signInButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Create Account Link */}
          <Animated.View
            style={[
              styles.createAccountContainer,
              {
                opacity: fadeIn,
              },
            ]}
          >
            <Text style={styles.createAccountText}>
              <Text style={styles.createAccountTextLight}>
                Don't have an account?{" "}
              </Text>
              <Text
                style={styles.createAccountLink}
                onPress={() => router.push("/(auth)/sign-up")}
              >
                Create Account
              </Text>
            </Text>
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
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.9}
            >
              <Image
                source={require("../../assets/icons/g-icon.png")}
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
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
  decorativeCircle: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: 77,
    left: 8,
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
    width: 40,
    height: 40,
    borderRadius: 1000,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Header
  header: {
    marginBottom: 24,
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
  // Form Card
  formCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
  },
  // Input Field
  inputFieldContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
    lineHeight: 24,
  },
  inputContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(208,209,212,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputContainerFocused: {
    borderColor: "rgba(255,255,255,0.6)",
  },
  input: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 24,
  },
  // Spacer
  spacer: {
    flex: 1,
    minHeight: 180,
  },
  // Sign In Button
  signInButton: {
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
  signInButtonText: {
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
  // Create Account
  createAccountContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  createAccountText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  createAccountTextLight: {
    color: "rgba(255,255,255,0.7)",
  },
  createAccountLink: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  // Divider
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 7,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 1000,
  },
  dividerText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.2)",
    lineHeight: 22,
  },
  // Google Button
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 1000,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  googleIcon: {
    width: 40,
    height: 40,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 22,
  },
});
