"use client";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Page indicator component
const PageIndicator: React.FC<{ currentPage: number; totalPages: number }> = ({
  currentPage,
  totalPages,
}) => {
  return (
    <View style={styles.pageIndicator}>
      {Array.from({ length: totalPages }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentPage ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
};

// Arrow Left Icon
const ArrowLeftIcon: React.FC = () => (
  <View style={styles.arrowIcon}>
    <Ionicons name="chevron-back" size={12} color="rgba(255,255,255,0.5)" />
  </View>
);

// Arrow Right Icon
const ArrowRightIcon: React.FC = () => (
  <View style={styles.arrowIcon}>
    <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.5)" />
  </View>
);

// Job Card Component
const JobCard: React.FC<{
  animatedValue: Animated.Value;
}> = ({ animatedValue }) => {
  const cardRotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["-5deg", "-0.89deg"],
  });

  const cardOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const cardTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  return (
    <Animated.View
      style={[
        styles.jobCardContainer,
        {
          opacity: cardOpacity,
          transform: [{ translateY: cardTranslateY }],
        },
      ]}
    >
      {/* Background stacked card effect */}
      <Animated.View
        style={[
          styles.stackedCardBack,
          {
            transform: [{ rotate: "3.76deg" }],
          },
        ]}
      />

      {/* Main job card */}
      <Animated.View
        style={[
          styles.jobCard,
          {
            transform: [{ rotate: cardRotate }],
          },
        ]}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.companyLogo}>
            <View style={styles.companyLogoPlaceholder} />
          </View>
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>92%</Text>
          </View>
        </View>

        {/* Job Info */}
        <View style={styles.jobInfo}>
          <View style={styles.jobTitleRow}>
            <Text style={styles.jobTitle}>Software Engineer (Frontend)</Text>
          </View>
          <View style={styles.companyRow}>
            <Text style={styles.companyName}>Global Solutions - New York, NY</Text>
          </View>
        </View>

        {/* Divider and Details */}
        <View style={styles.jobDetails}>
          <View style={styles.divider} />
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="briefcase-outline" size={14} color="rgba(17,17,17,0.7)" />
              <Text style={styles.detailText}>Full-time</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={14} color="rgba(17,17,17,0.7)" />
              <Text style={styles.detailText}>120k - 150k</Text>
            </View>
          </View>
        </View>

        {/* Remote Badge - centered */}
        <View style={styles.remoteBadgeContainer}>
          <View style={styles.remoteBadge}>
            <Text style={styles.remoteBadgeText}>remote</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// New Jobs Badge Component
const NewJobsBadge: React.FC<{ animatedValue: Animated.Value }> = ({
  animatedValue,
}) => {
  const badgeOpacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const badgeScale = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 0.8, 1],
  });

  return (
    <Animated.View
      style={[
        styles.newJobsBadgeContainer,
        {
          opacity: badgeOpacity,
          transform: [{ scale: badgeScale }, { rotate: "15.72deg" }],
        },
      ]}
    >
      <LinearGradient
        colors={["#FF6B6B", "#FF8E53"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.newJobsBadge}
      >
        <Text style={styles.fireEmoji}>🔥</Text>
        <Text style={styles.newJobsText}> 50 new jobs today</Text>
      </LinearGradient>
    </Animated.View>
  );
};

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentPage] = useState(0);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const cardAnimation = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Header entrance
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    // Title entrance
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    // Card entrance
    Animated.timing(cardAnimation, {
      toValue: 1,
      duration: 800,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Buttons entrance
    Animated.parallel([
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 500,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsTranslateY, {
        toValue: 0,
        duration: 500,
        delay: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Gradient background matching Figma: 173deg gradient */}
      <LinearGradient
        colors={["#1263B2", "#0D4982", "#082A4C"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circle in top-left */}
      <View style={styles.decorativeCircle} />

      {/* Main Content */}
      <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
        {/* Header with Logo and Page Indicator */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <PageIndicator currentPage={currentPage} totalPages={2} />
        </Animated.View>

        {/* Title Section */}
        <Animated.View
          style={[
            styles.titleSection,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          {/* Main Title with gradient text effect */}
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>
              Swipe to Your{"\n"}Next Interview
            </Text>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Quickly browse and swipe to apply to jobs tailored just for you.
            Matches appear everyday.
          </Text>
        </Animated.View>

        {/* Swipe Instructions & Card Section */}
        <View style={styles.swipeSection}>
          {/* Swipe Instructions */}
          <Animated.View
            style={[
              styles.swipeInstructions,
              {
                opacity: titleOpacity,
              },
            ]}
          >
            <View style={styles.swipeDirection}>
              <ArrowLeftIcon />
              <Text style={styles.swipeText}>SWIPE TO PASS</Text>
            </View>
            <View style={styles.swipeDot} />
            <View style={styles.swipeDirection}>
              <Text style={styles.swipeText}>SWIPE TO APPLY</Text>
              <ArrowRightIcon />
            </View>
          </Animated.View>

          {/* Job Card with stacked effect */}
          <View style={styles.cardSection}>
            {/* Bottom stacked card (rotated more) */}
            <View style={styles.bottomStackedCard} />

            {/* Job Card */}
            <JobCard animatedValue={cardAnimation} />

            {/* New Jobs Badge */}
            <NewJobsBadge animatedValue={cardAnimation} />
          </View>
        </View>

        {/* Bottom Buttons */}
        <Animated.View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + 20,
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => router.push("/(auth)/sign-up")}
            activeOpacity={0.9}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>

          <View style={styles.signInRow}>
            <Text style={styles.signInLabel}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              activeOpacity={0.7}
            >
              <Text style={styles.signInLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: SCREEN_HEIGHT,
  },
  decorativeCircle: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: 83,
    left: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
  },
  // Header styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  logo: {
    width: 73,
    height: 32,
  },
  pageIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  dot: {
    height: 8,
    borderRadius: 10000,
  },
  dotActive: {
    width: 15,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  dotInactive: {
    width: 8,
    backgroundColor: "rgba(217,217,217,0.3)",
  },
  // Title section styles
  titleSection: {
    alignItems: "center",
    gap: 8,
  },
  titleContainer: {
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 48,
    // Simulating gradient text with a lighter blue-white color
    textShadowColor: "rgba(180,219,232,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 326,
    marginTop: 8,
  },
  // Swipe section styles
  swipeSection: {
    flex: 1,
    alignItems: "center",
    marginTop: 40,
  },
  swipeInstructions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 26,
  },
  swipeDirection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  swipeText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
    fontWeight: "400",
  },
  swipeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(217,217,217,0.8)",
  },
  arrowIcon: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  // Card section styles
  cardSection: {
    width: "100%",
    height: 350,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bottomStackedCard: {
    position: "absolute",
    width: 297,
    height: 286,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderRightWidth: 0.8,
    borderBottomWidth: 0.8,
    borderLeftWidth: 0.8,
    borderColor: "rgba(255,255,255,0.3)",
    transform: [{ rotate: "-8.23deg" }],
    top: 20,
    left: 25,
  },
  // Job card styles
  jobCardContainer: {
    position: "relative",
    width: 260,
    height: 271,
  },
  stackedCardBack: {
    position: "absolute",
    width: 289,
    height: 288,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderRightWidth: 0.8,
    borderBottomWidth: 0.8,
    borderLeftWidth: 0.8,
    borderColor: "rgba(255,255,255,0.2)",
    top: -8,
    left: -16,
  },
  jobCard: {
    width: 260,
    height: 271,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 16,
    padding: 16,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    gap: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "rgba(17,17,17,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  companyLogoPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: "rgba(17,17,17,0.1)",
  },
  matchBadge: {
    backgroundColor: "#DFF4E0",
    borderRadius: 1000,
    paddingHorizontal: 8,
    borderWidth: 0.8,
    borderColor: "rgba(65,148,86,0.6)",
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#43A047",
    lineHeight: 22,
  },
  // Job info styles
  jobInfo: {
    gap: 0,
  },
  jobTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(17,17,17,0.7)",
    lineHeight: 22,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  companyName: {
    fontSize: 10,
    color: "rgba(17,17,17,0.7)",
    lineHeight: 22,
  },
  // Job details styles
  jobDetails: {
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(17,17,17,0.1)",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: "rgba(17,17,17,0.7)",
    lineHeight: 22,
  },
  // Remote badge styles
  remoteBadgeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  remoteBadge: {
    backgroundColor: "rgba(251,233,179,0.6)",
    borderRadius: 1000,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  remoteBadgeText: {
    fontSize: 12,
    color: "rgba(132,112,54,0.8)",
    lineHeight: 22,
  },
  // New jobs badge styles
  newJobsBadgeContainer: {
    position: "absolute",
    top: -25,
    right: 10,
  },
  newJobsBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 4,
  },
  fireEmoji: {
    fontSize: 12.5,
  },
  newJobsText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  // Footer styles
  footer: {
    gap: 9,
    paddingHorizontal: 0,
  },
  getStartedButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBFBFB",
    paddingVertical: 16,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  getStartedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0D4982",
  },
  signInRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  signInLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 22,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 22,
  },
});
