"use client";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, spacing } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";

const { width, height } = Dimensions.get("window");

const HeroSlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  return (
    <View style={styles.slideContent}>
      <Animated.View
        style={{
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
        }}
      >
        <Text style={styles.headline}>
          Auto-Apply to{"\n"}
          <Text style={{ color: "rgba(255,255,255,0.8)" }}>100+ Jobs</Text>
        </Text>

        <Text style={styles.subtitle}>
          Land your dream job 5x faster. AI-tailored resumes & cover letters for
          every application.
        </Text>

        <View style={styles.trustBadgeContainer}>
          <Text style={styles.trustBadgeLabel}>
            TRUSTED BY PROFESSIONALS AT
          </Text>
          <View style={styles.trustLogosRow}>
            {/* Simple text placeholders for "Big Tech" style logos for now */}
            <Text style={styles.trustLogoText}>Google</Text>
            <View style={styles.trustDivider} />
            <Text style={styles.trustLogoText}>Meta</Text>
            <View style={styles.trustDivider} />
            <Text style={styles.trustLogoText}>Airbnb</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const DemoSlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;

  const cardRotate = useRef(new Animated.Value(0)).current;
  const cardTranslateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  const bgCardScale = useRef(new Animated.Value(0.95)).current;
  const bgCardOpacity = useRef(new Animated.Value(0.5)).current;
  const swipeHintOpacity = useRef(new Animated.Value(0)).current;
  const swipeHintScale = useRef(new Animated.Value(0.8)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(bgCardScale, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
          delay: 200,
        }),
      ]).start();

      const swipeHintLoop = Animated.sequence([
        Animated.delay(1500),
        Animated.parallel([
          Animated.timing(swipeHintOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(swipeHintScale, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(swipeHintOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(swipeHintScale, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1000),
      ]);

      const pulseLoop = Animated.sequence([
        Animated.delay(1800),
        Animated.timing(pulseOpacity, {
          toValue: 0.7,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0.4,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]);

      Animated.loop(swipeHintLoop).start();
      Animated.loop(pulseLoop).start();

      const animationSequence = Animated.sequence([
        Animated.delay(1200),
        Animated.parallel([
          Animated.timing(cardTranslateX, {
            toValue: 160,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardRotate, {
            toValue: 0.3,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(progressWidth, {
            toValue: 100,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.spring(bgCardScale, {
            toValue: 1.05,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(bgCardOpacity, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(cardTranslateX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(cardRotate, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.spring(cardOpacity, {
            toValue: 1,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(progressWidth, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
          Animated.spring(bgCardScale, {
            toValue: 0.98,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(bgCardOpacity, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(cardTranslateX, {
            toValue: -160,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardRotate, {
            toValue: -0.3,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(progressWidth, {
            toValue: 100,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.spring(bgCardScale, {
            toValue: 1.05,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(bgCardOpacity, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(cardTranslateX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(cardRotate, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.spring(cardOpacity, {
            toValue: 1,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(progressWidth, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
          Animated.spring(bgCardScale, {
            toValue: 0.98,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(bgCardOpacity, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(800),
      ]);

      Animated.loop(animationSequence).start();
    }

    return () => {
      cardTranslateX.setValue(0);
      cardRotate.setValue(0);
      cardOpacity.setValue(1);
      progressWidth.setValue(0);
      bgCardScale.setValue(0.95);
      bgCardOpacity.setValue(0.5);
      swipeHintOpacity.setValue(0);
      swipeHintScale.setValue(0.8);
      pulseOpacity.setValue(0.4);
    };
  }, [isActive]);

  const jobCards = [
    {
      title: "Senior Frontend Engineer",
      company: "TechFlow",
      location: "San Francisco, CA",
      salary: "$140k - $180k",
      match: "92%",
      workType: "Remote",
      employment: "Full-time",
      experience: "5+ years",
    },
    {
      title: "Product Designer",
      company: "Creative Labs",
      location: "New York, NY",
      salary: "$110k - $140k",
      match: "88%",
      workType: "Hybrid",
      employment: "Full-time",
      experience: "4+ years",
    },
  ];

  return (
    <View style={styles.slideContent}>
      <Animated.View
        style={[
          styles.demoContent,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
        <View style={styles.cardStack}>
          <Animated.View
            style={[
              styles.jobCard,
              styles.bgCard2,
              {
                transform: [{ scale: bgCardScale }],
                opacity: bgCardOpacity,
              },
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.companyLogoPlaceholder} />
                <View style={styles.cardBadge}>
                  <Text style={styles.badgeText}>88%</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>Product Designer</Text>
              <Text style={styles.cardCompany}>Creative Labs</Text>
              <Text style={styles.cardLocation}>New York, NY</Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.jobCard,
              styles.animatedCard,
              {
                transform: [
                  { translateX: cardTranslateX },
                  {
                    rotate: cardRotate.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: ["-18deg", "0deg", "18deg"],
                    }),
                  },
                ],
                opacity: cardOpacity,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.cardPulseRing,
                {
                  opacity: pulseOpacity,
                },
              ]}
            />

            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.companyLogoPlaceholder} />
                <View style={styles.cardBadge}>
                  <Text style={styles.badgeText}>92%</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>Senior Frontend Engineer</Text>
              <Text style={styles.cardCompany}>TechFlow</Text>
              <Text style={styles.cardLocation}>San Francisco, CA</Text>

              <View style={styles.jobDetailsSection}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Compensation</Text>
                  <Text style={styles.detailValue}>$140k - $180k</Text>
                </View>
                <View style={styles.detailRow}>
                  <View style={[styles.detailBadge, styles.badgeRemote]}>
                    <Text style={styles.badgeLabelText}>Remote</Text>
                  </View>
                  <View style={[styles.detailBadge, styles.badgeFulltime]}>
                    <Text style={styles.badgeLabelText}>Full-time</Text>
                  </View>
                </View>
              </View>
            </View>
            <Animated.View
              style={[
                styles.progressIndicator,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.swipeHintLeft,
              {
                opacity: swipeHintOpacity,
                transform: [{ scale: swipeHintScale }],
              },
            ]}
          >
            <Ionicons name="arrow-back" size={32} color="rgba(255,68,68,0.8)" />
          </Animated.View>
          <Animated.View
            style={[
              styles.swipeHintRight,
              {
                opacity: swipeHintOpacity,
                transform: [{ scale: swipeHintScale }],
              },
            ]}
          >
            <Ionicons
              name="arrow-forward"
              size={32}
              color="rgba(76,175,80,0.8)"
            />
          </Animated.View>
        </View>

        <Text style={styles.actionInstructions}>
          ← Swipe to pass • Swipe to apply →
        </Text>

        <Text style={styles.supportingText}>
          Matches appear every day. Never miss an opportunity again.
        </Text>
      </Animated.View>
    </View>
  );
};

// Pagination dots component
const PaginationDots: React.FC<{
  totalSlides: number;
  activeIndex: number;
  scrollX: Animated.Value;
}> = ({ totalSlides, activeIndex, scrollX }) => {
  return (
    <View style={styles.pagination}>
      {Array.from({ length: totalSlides }).map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: "clamp",
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Header animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(-20)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(40)).current;
  const decorativeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
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

    // Buttons entrance
    Animated.parallel([
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 400,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const slides = [
    { id: "hero", component: HeroSlide },
    { id: "demo", component: DemoSlide },
  ];

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      router.push("/(auth)/sign-up");
    }
  };

  const renderSlide = ({
    item,
    index,
  }: {
    item: (typeof slides)[0];
    index: number;
  }) => {
    const SlideComponent = item.component;
    return (
      <View style={styles.slide}>
        <SlideComponent isActive={index === activeIndex} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Gradient background */}
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

      {/* Decorative circles */}
      <Animated.View
        style={[styles.decorativeCircle1, { opacity: decorativeOpacity }]}
      />
      <Animated.View
        style={[styles.decorativeCircle2, { opacity: decorativeOpacity }]}
      />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        {/* Header with logo */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: logoOpacity,
              transform: [{ translateY: logoTranslateY }],
            },
          ]}
        >
          <Image
            source={require("../../assets/full-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          scrollEventThrottle={16}
          style={styles.slideList}
        />

        {/* Pagination */}
        <PaginationDots
          totalSlides={slides.length}
          activeIndex={activeIndex}
          scrollX={scrollX}
        />

        {/* Bottom buttons */}
        <Animated.View
          style={[
            styles.buttonsContainer,
            {
              paddingBottom: insets.bottom + 20,
              opacity: buttonsOpacity,
              transform: [{ translateY: buttonsTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>
              {activeIndex === slides.length - 1 ? "Get Started" : "Next"}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/(auth)/sign-in")}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>
              Already have an account?{" "}
              <Text style={styles.signInText}>Sign in</Text>
            </Text>
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: spacing[6],
  },
  logo: {
    width: 140,
    height: 40,
    tintColor: "#FFFFFF",
  },
  slideList: {
    flex: 1,
  },
  slide: {
    width: width,
    flex: 1,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: spacing[6],
    justifyContent: "center",
    paddingTop: spacing[8], // Reduced top padding
  },
  headline: {
    fontSize: 42, // Reduced from 52
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 48,
    letterSpacing: -1.2,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    marginTop: spacing[5],
    lineHeight: 24,
    maxWidth: 300,
    fontWeight: "500",
  },
  trustBadgeContainer: {
    marginTop: spacing[8],
    alignItems: "flex-start",
  },
  trustBadgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.5,
    marginBottom: spacing[3],
  },
  trustLogosRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  trustLogoText: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: -0.5,
  },
  trustDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: spacing[4],
  },
  demoContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center", // Reverting to center as header text is gone
    width: "100%",
    paddingHorizontal: spacing[6],
    paddingTop: spacing[0], // Removing the extra padding
  },
  demoTitle: {
    fontSize: 32, // Reduced from 40
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: spacing[2],
    lineHeight: 38,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  demoTitleAccent: {
    color: "#FCD34D",
    fontStyle: "italic",
  },
  demoSubheading: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
    marginBottom: spacing[4], // Reduced margin
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  cardStack: {
    width: 280,
    height: 380, // Reduced height
    marginVertical: spacing[4],
    position: "relative",
  },
  jobCard: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(11, 107, 203, 0.08)",
    padding: spacing[4],
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  animatedCard: {
    zIndex: 10,
    overflow: "hidden",
  },
  bgCard2: {
    zIndex: 5,
    transform: [{ translateY: 10 }, { scale: 0.95 }],
    opacity: 0.5,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[2],
  },
  companyLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#0B6BCB",
    opacity: 0.1,
  },
  cardBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)", // Softer bg
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669", // Darker text
    letterSpacing: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardCompany: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0B6BCB",
    marginBottom: 2,
  },
  cardLocation: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: spacing[3],
  },
  jobDetailsSection: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: spacing[3],
    gap: spacing[2],
  },
  detailItem: {
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10B981",
  },
  detailRow: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[1],
  },
  detailBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  badgeRemote: {
    backgroundColor: "rgba(11, 107, 203, 0.05)",
  },
  badgeFulltime: {
    backgroundColor: "rgba(236, 72, 153, 0.05)",
  },
  badgeLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: spacing[8],
    marginTop: spacing[4], // Reduced margin
    alignItems: "center",
    justifyContent: "center",
  },
  actionHint: {
    alignItems: "center",
    gap: spacing[1],
  },
  actionButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1 }],
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  acceptButton: {
    backgroundColor: "#10B981",
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  actionInstructions: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    marginTop: spacing[6],
    textAlign: "center",
    letterSpacing: 0.3,
  },
  supportingText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.65)",
    marginTop: spacing[3],
    textAlign: "center",
    lineHeight: 18,
    fontStyle: "italic",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[2],
    paddingVertical: spacing[4],
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  buttonsContainer: {
    gap: spacing[4],
    paddingHorizontal: spacing[6],
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
    color: "#0B6BCB",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  secondaryButtonText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
  },
  signInText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  progressIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: "#10B981",
    opacity: 0.8,
  },
  cardPulseRing: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(76,175,80,0.3)",
  },
  swipeHintLeft: {
    position: "absolute",
    left: -50,
    top: "50%",
    marginTop: -16,
  },
  swipeHintRight: {
    position: "absolute",
    right: -50,
    top: "50%",
    marginTop: -16,
  },
});
