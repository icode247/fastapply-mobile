import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, spacing } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { getApiErrorMessage } from "../../src/services/api";
import { authService } from "../../src/services/auth.service";

// Animated input component
const AnimatedInput: React.FC<{
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  delay: number;
}> = ({
  placeholder,
  value,
  onChangeText,
  icon,
  keyboardType = "default",
  autoCapitalize = "none",
  delay,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const borderScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  useEffect(() => {
    Animated.spring(borderScale, {
      toValue: isFocused ? 1 : 0,
      tension: 100,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const borderColor = borderScale.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.2)", "#FFFFFF"],
  });

  return (
    <Animated.View
      style={[
        styles.inputWrapper,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Animated.View style={[styles.inputContainer, { borderColor }]}>
        <View style={styles.inputInner}>
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? "#FFFFFF" : "rgba(255,255,255,0.6)"}
            style={styles.inputIcon}
          />
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
      </Animated.View>
    </Animated.View>
  );
};

// Animated button with press effect
const AnimatedButton: React.FC<{
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant: "primary" | "social";
  icon?: keyof typeof Ionicons.glyphMap;
  delay: number;
  colors: any;
}> = ({ title, onPress, loading, variant, icon, delay, colors }) => {
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  if (variant === "primary") {
    return (
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            opacity,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          disabled={loading}
          style={styles.primaryButton}
        >
          {loading ? (
            <Animated.View style={styles.loadingDot} />
          ) : (
            <>
              <Text
                style={[styles.primaryButtonText, { color: colors.primary }]}
              >
                {title}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.primary} />
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.buttonWrapper,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.socialButton}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={22}
            color="#FFF"
            style={{ marginRight: spacing[3] }}
          />
        )}
        <Text style={styles.socialButtonText}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Header animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-30)).current;
  const decorativeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Decorative elements
    Animated.timing(decorativeOpacity, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();
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
      {/* Background - Match Welcome Screen */}
      <LinearGradient
        colors={
          isDark
            ? [colors.primary, colors.primaryDark, colors.background]
            : [colors.primary, colors.primaryDark, colors.primary700]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles - Match Welcome Screen */}
      <Animated.View
        style={[styles.decorativeCircle1, { opacity: decorativeOpacity }]}
      />
      <Animated.View
        style={[styles.decorativeCircle2, { opacity: decorativeOpacity }]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Back button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => router.back()}
        >
          <BlurView intensity={20} tint="light" style={styles.backButtonBlur}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </BlurView>
        </TouchableOpacity>

        {/* Content */}
        <View style={[styles.content, { paddingTop: insets.top + 70 }]}>
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }],
              },
            ]}
          >
            <Text style={styles.welcomeBack}>Welcome back</Text>
            <Text style={styles.title}>Sign in to continue</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a verification code to sign in
              instantly
            </Text>
          </Animated.View>

          {/* Form */}
          <View style={styles.form}>
            <AnimatedInput
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              delay={200}
            />

            <AnimatedButton
              title="Continue with Email"
              onPress={handleSignIn}
              loading={loading}
              variant="primary"
              delay={400}
              colors={colors}
            />

            {/* Divider */}
            <Animated.View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            <AnimatedButton
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              variant="social"
              icon="logo-google"
              delay={600}
              colors={colors}
            />
          </View>

          {/* Footer */}
          <Animated.View
            style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
          >
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
              <Text style={styles.footerText}>
                Don't have an account?{" "}
                <Text style={styles.footerLink}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativeCircle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: -100,
    right: -100,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.03)",
    bottom: 100,
    left: -80,
  },
  keyboardView: {
    flex: 1,
  },
  logoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
  },
  backButton: {
    position: "absolute",
    left: spacing[4],
    zIndex: 10,
    borderRadius: 14,
    overflow: "hidden",
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
  },
  header: {
    marginBottom: spacing[10],
  },
  welcomeBack: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    marginBottom: spacing[2],
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: spacing[3],
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 24,
  },
  form: {
    gap: spacing[4],
  },
  inputWrapper: {
    marginBottom: spacing[2],
  },
  inputContainer: {
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  inputInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  inputIcon: {
    marginRight: spacing[3],
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  buttonWrapper: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.xl,
    gap: spacing[2],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
  loadingDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.5)",
    marginHorizontal: spacing[4],
    fontSize: 14,
  },
  footer: {
    marginTop: "auto",
    alignItems: "center",
  },
  footerText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
  },
  footerLink: {
    color: "#FFF",
    fontWeight: "700",
  },
});
