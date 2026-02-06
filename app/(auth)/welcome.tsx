"use client";

import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../src/components/ui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { uiScale } from "../../src/constants/theme";

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

// ============== SLIDE 1 COMPONENTS ==============

// Company logo imports
const companyLogos = {
  google: require("../../assets/icons/google-icon.png"),
  meta: require("../../assets/icons/meta-icon.png"),
  airbnb: require("../../assets/icons/airbnb-icon.png"),
};

// Company data for trust cards
const companies = [
  {
    name: "Google",
    jobs: "2,847 jobs",
    logo: companyLogos.google,
  },
  {
    name: "Meta",
    jobs: "1,923 jobs",
    logo: companyLogos.meta,
    hasCheck: true,
  },
  {
    name: "Airbnb",
    jobs: "1,456 jobs",
    logo: companyLogos.airbnb,
  },
];

// Company Card Component for Slide 1
const CompanyCard: React.FC<{
  company: (typeof companies)[0];
  index: number;
  animatedValue: Animated.Value;
}> = ({ company, index, animatedValue }) => {
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50 + index * 20, 0],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // First card tilts down (negative rotation), last card tilts up (positive rotation)
  // Middle card stays flat
  const getRotation = () => {
    if (index === 0) return "-4deg"; // First card - tilted down/left
    if (index === 2) return "4deg"; // Last card - tilted up/right
    return "0deg"; // Middle card - flat
  };

  return (
    <Animated.View
      style={[
        styles.companyCard,
        {
          opacity,
          transform: [{ translateY }, { rotate: getRotation() }],
        },
      ]}
    >
      <View style={styles.companyCardInner}>
        <View style={styles.companyLogo}>
          <Image
            source={company.logo}
            style={styles.companyLogoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{company.name}</Text>
          <Text style={styles.companyJobs}>{company.jobs}</Text>
        </View>
        {company.hasCheck && (
          <View style={styles.checkBadge}>
            <Ionicons
              name="checkmark"
              size={Math.round(16 * uiScale)}
              color="#10B981"
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// Gradient Text Component for Slide 1 title
const GradientText: React.FC<{ children: string; style?: any }> = ({
  children,
  style,
}) => {
  return (
    <MaskedView
      maskElement={<Text style={[styles.slide1Title, style]}>{children}</Text>}
    >
      <LinearGradient
        colors={["#FFFFFF", "#B4DBE8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[styles.slide1Title, style, { opacity: 0 }]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

// Slide 1 Component
const Slide1: React.FC<{ cardsAnimation: Animated.Value }> = ({
  cardsAnimation,
}) => {
  return (
    <View style={styles.slideContainer}>
      {/* Title Section - positioned at top: 98px from nav (which is at 62px) = 36px from header */}
      <View style={styles.slide1TitleSection}>
        <GradientText>{`Swipe-Apply with\nVoice Auto-Pilot`}</GradientText>
      </View>

      {/* Subtitle - positioned at top: 194px */}
      <View style={styles.slide1SubtitleSection}>
        <Text style={styles.slide1Subtitle}>
          Just tell Scout what you're looking for. Our AI voice assistant finds,
          matches, and applies to 50+ jobs daily-hands-free.
        </Text>
      </View>

      {/* Trust Section - positioned at top: 300px */}
      <View style={styles.trustSection}>
        <Text style={styles.trustLabel}>TRUSTED BY PROFESSIONALS AT</Text>

        {/* Company Cards */}
        <View style={styles.cardsContainer}>
          {companies.map((company, index) => (
            <CompanyCard
              key={company.name}
              company={company}
              index={index}
              animatedValue={cardsAnimation}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// ============== SLIDE 2 COMPONENTS ==============

// Arrow Left Icon
const ArrowLeftIcon: React.FC = () => (
  <View style={styles.arrowIcon}>
    <Ionicons
      name="chevron-back"
      size={Math.round(12 * uiScale)}
      color="rgba(255,255,255,0.5)"
    />
  </View>
);

// Arrow Right Icon
const ArrowRightIcon: React.FC = () => (
  <View style={styles.arrowIcon}>
    <Ionicons
      name="chevron-forward"
      size={Math.round(12 * uiScale)}
      color="rgba(255,255,255,0.5)"
    />
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
          <View style={styles.jobCompanyLogo}>
            <View style={styles.jobCompanyLogoPlaceholder} />
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
          <View style={styles.jobCompanyRow}>
            <Text style={styles.jobCompanyName}>
              Global Solutions - New York, NY
            </Text>
          </View>
        </View>

        {/* Divider and Details */}
        <View style={styles.jobDetails}>
          <View style={styles.divider} />
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons
                name="briefcase-outline"
                size={Math.round(14 * uiScale)}
                color="rgba(17,17,17,0.7)"
              />
              <Text style={styles.detailText}>Full-time</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons
                name="cash-outline"
                size={Math.round(14 * uiScale)}
                color="rgba(17,17,17,0.7)"
              />
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
          transform: [{ scale: badgeScale }, { rotate: "5deg" }],
        },
      ]}
    >
      <LinearGradient
        colors={["rgba(255,107,107,0.7)", "rgba(255,142,83,0.7)"]}
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

// Slide 2 Component
const Slide2: React.FC<{ cardAnimation: Animated.Value }> = ({
  cardAnimation,
}) => {
  return (
    <View style={styles.slideContainer}>
      {/* Title Section */}
      <View style={styles.titleSection}>
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
      </View>

      {/* Swipe Instructions & Card Section */}
      <View style={styles.swipeSection}>
        {/* Swipe Instructions */}
        <View style={styles.swipeInstructions}>
          <View style={styles.swipeDirection}>
            <ArrowLeftIcon />
            <Text style={styles.swipeText}>SWIPE TO PASS</Text>
          </View>
          <View style={styles.swipeDot} />
          <View style={styles.swipeDirection}>
            <Text style={styles.swipeText}>SWIPE TO APPLY</Text>
            <ArrowRightIcon />
          </View>
        </View>

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
    </View>
  );
};

// ============== MAIN COMPONENT ==============
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;
  const cardsAnimation = useRef(new Animated.Value(0)).current;
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

    // Cards animation (for slide 1)
    Animated.timing(cardsAnimation, {
      toValue: 1,
      duration: 800,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Card animation (for slide 2)
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
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsTranslateY, {
        toValue: 0,
        duration: 500,
        delay: 300,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Auto-scroll slides - always sliding left (infinite carousel)
  const slideIndexRef = useRef(0);

  useEffect(() => {
    const totalRealPages = 2;
    const slideWidth = SCREEN_WIDTH - 44;

    const interval = setInterval(() => {
      slideIndexRef.current += 1;

      // Scroll to next slide
      scrollViewRef.current?.scrollTo({
        x: slideIndexRef.current * slideWidth,
        animated: true,
      });

      // Update indicator (always shows 0 or 1)
      setCurrentPage(slideIndexRef.current % totalRealPages);

      // After scrolling to the clone (index 2), instantly reset to real slide 1 (index 0)
      if (slideIndexRef.current >= totalRealPages) {
        setTimeout(() => {
          slideIndexRef.current = 0;
          scrollViewRef.current?.scrollTo({
            x: 0,
            animated: false,
          });
        }, 500); // Wait for animation to complete
      }
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / (SCREEN_WIDTH - 44));
    // Only show indicator for real pages (0 or 1)
    setCurrentPage(page % 2);
  };

  return (
    <View style={styles.container}>
      {/* Gradient background matching Figma: 173deg gradient */}
      <LinearGradient
        colors={["#1263B2", "#0D4982", "#082A4C"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Main Content */}
      <View style={[styles.content, { paddingTop: insets.top + 12,  }]}>
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
          {/* <Image
            source={require("../../assets/icons/scout-icon.png")}
            style={styles.logoIcon}
            resizeMode="contain"
          /> */}
          <PageIndicator currentPage={currentPage} totalPages={2} />
        </Animated.View>

        {/* Swipeable Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Slide 1 */}
          <View style={[styles.slide, { width: SCREEN_WIDTH - 44 }]}>
            <Slide1 cardsAnimation={cardsAnimation} />
          </View>

          {/* Slide 2 */}
          <View style={[styles.slide, { width: SCREEN_WIDTH - 44 }]}>
            <Slide2 cardAnimation={cardAnimation} />
          </View>

          {/* Clone of Slide 1 for infinite loop */}
          <View style={[styles.slide, { width: SCREEN_WIDTH - 44 }]}>
            <Slide1 cardsAnimation={cardsAnimation} />
          </View>
        </ScrollView>

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
  logoIcon: {
    width: Math.round(56 * uiScale),
    height: Math.round(56 * uiScale),
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
  // ScrollView styles
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  slide: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
  },
  // ============== SLIDE 1 STYLES ==============
  slide1TitleSection: {
    alignItems: "center",
  },
  slide1Title: {
    fontSize: Math.round(40 * uiScale),
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: Math.round(42 * uiScale),
    width: Math.round(350 * uiScale),
    // Note: React Native doesn't support gradient text natively
    // The gradient effect (132deg, white to #B4DBE8) would need expo-linear-gradient with MaskedView
  },
  slide1SubtitleSection: {
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 12,
  },
  slide1Subtitle: {
    fontSize: Math.round(14 * uiScale),
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: Math.round(22 * uiScale),
    width: Math.round(326 * uiScale),
  },
  trustSection: {
    marginTop: 40,
    alignItems: "center",
  },
  trustLabel: {
    fontSize: Math.round(14 * uiScale),
    fontWeight: "400",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 48,
    width: Math.round(297 * uiScale),
  },
  cardsContainer: {
    gap: 24,
    width: "100%",
    paddingHorizontal: 0,
  },
  companyCard: {
    borderRadius: 16,
    ...(Platform.OS === "ios" ? { overflow: "hidden" as const } : {}),
  },
  companyCardInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  companyLogo: {
    width: Math.round(44 * uiScale),
    height: Math.round(44 * uiScale),
    borderRadius: Math.round(10 * uiScale),
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  companyLogoImage: {
    width: Math.round(44 * uiScale),
    height: Math.round(44 * uiScale),
    borderRadius: Math.round(10 * uiScale),
  },
  companyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  companyName: {
    fontSize: Math.round(16 * uiScale),
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  companyJobs: {
    fontSize: Math.round(13 * uiScale),
    color: "rgba(255,255,255,0.6)",
  },
  checkBadge: {
    width: Math.round(28 * uiScale),
    height: Math.round(28 * uiScale),
    borderRadius: Math.round(14 * uiScale),
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  // ============== SLIDE 2 STYLES ==============
  titleSection: {
    alignItems: "center",
    gap: 8,
  },
  titleContainer: {
    alignItems: "center",
  },
  mainTitle: {
    fontSize: Math.round(40 * uiScale),
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: Math.round(48 * uiScale),
    textShadowColor: "rgba(180,219,232,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: Math.round(14 * uiScale),
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: Math.round(22 * uiScale),
    maxWidth: Math.round(326 * uiScale),
    marginTop: 8,
  },
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
    fontSize: Math.round(14 * uiScale),
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
    width: Math.round(16 * uiScale),
    height: Math.round(16 * uiScale),
    justifyContent: "center",
    alignItems: "center",
  },
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
  jobCompanyLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "rgba(17,17,17,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  jobCompanyLogoPlaceholder: {
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
    fontSize: Math.round(11 * uiScale),
    fontWeight: "600",
    color: "#43A047",
    lineHeight: Math.round(22 * uiScale),
  },
  jobInfo: {
    gap: 0,
  },
  jobTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  jobTitle: {
    fontSize: Math.round(14 * uiScale),
    fontWeight: "700",
    color: "rgba(17,17,17,0.7)",
    lineHeight: Math.round(22 * uiScale),
  },
  jobCompanyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  jobCompanyName: {
    fontSize: Math.round(10 * uiScale),
    color: "rgba(17,17,17,0.7)",
    lineHeight: Math.round(22 * uiScale),
  },
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
    fontSize: Math.round(12 * uiScale),
    color: "rgba(17,17,17,0.7)",
    lineHeight: Math.round(22 * uiScale),
  },
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
    fontSize: Math.round(12 * uiScale),
    color: "rgba(132,112,54,0.8)",
    lineHeight: Math.round(22 * uiScale),
  },
  newJobsBadgeContainer: {
    position: "absolute",
    top: 5,
    left: 0,
    right: 40,
    alignItems: "center",
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
    fontSize: Math.round(12.5 * uiScale),
  },
  newJobsText: {
    fontSize: Math.round(10 * uiScale),
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
    fontSize: Math.round(16 * uiScale),
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
    fontSize: Math.round(14 * uiScale),
    color: "rgba(255,255,255,0.7)",
    lineHeight: Math.round(22 * uiScale),
  },
  signInLink: {
    fontSize: Math.round(14 * uiScale),
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: Math.round(22 * uiScale),
  },
});
