import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, spacing } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";

const { width, height } = Dimensions.get("window");

// Slide 1: Hero slide
const HeroSlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;

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
          Land your{"\n"}dream job{"\n"}
          <Text style={styles.headlineAccent}>today.</Text>
        </Text>

        <Text style={styles.subtitle}>
          AI-powered applications that get you noticed. One tap is all it takes.
        </Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="flash" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.featureText}>One-Tap Apply</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.featureText}>AI-Powered</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="trending-up" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.featureText}>Track Progress</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// Slide 2: Discover slide (App Mock matching wireframe)
const DiscoverSlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const mockScale = useRef(new Animated.Value(0.9)).current;

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
        Animated.spring(mockScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isActive]);

  return (
    <View style={styles.slideContent}>
      <Animated.View
        style={[
          styles.slide2Content,
          {
            opacity: contentOpacity,
            transform: [
              { translateY: contentTranslateY },
              { scale: mockScale },
            ],
          },
        ]}
      >
        {/* Mock Device Frame */}
        <View style={styles.mockDevice}>
          {/* Header: DISCOVER LOGO + Grid Icon */}
          <View style={styles.mockDeviceHeader}>
            <Text style={styles.mockDeviceLogoText}>DISCOVER LOGO</Text>
            <View style={styles.mockGridIcon}>
              <View style={styles.mockGridSquare} />
              <View style={styles.mockGridSquare} />
              <View style={styles.mockGridSquare} />
              <View style={styles.mockGridSquare} />
            </View>
          </View>

          {/* Squiggly text lines */}
          <View style={styles.mockTextLines}>
            <View style={styles.mockSquiggleLong} />
            <View style={styles.mockSquiggleShort} />
          </View>

          {/* Large content area */}
          <View style={styles.mockContentArea} />

          {/* Bottom action bar */}
          <View style={styles.mockBottomBar}>
            <View style={styles.mockIconCircle}>
              <Ionicons name="power" size={18} color="#0B6BCB" />
            </View>
            <View style={styles.mockBarDivider} />
            <Ionicons name="book-outline" size={20} color="#0B6BCB" />
            <View style={styles.mockBarDivider} />
            <Text style={styles.mockXIcon}>X</Text>
            <View style={styles.mockBarDivider} />
            <View style={[styles.mockIconCircle, styles.mockMicCircle]}>
              <Ionicons name="mic" size={18} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Caption */}
        <Text style={styles.mockDeviceCaption}>
          Experience the app in action
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
    { id: "discover", component: DiscoverSlide },
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
    paddingTop: spacing[16], // Push content down to visual center
  },
  // Slide 1 styles
  headline: {
    fontSize: 52,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 58,
    letterSpacing: -1.5,
  },
  headlineAccent: {
    color: "rgba(255,255,255,0.7)",
  },
  subtitle: {
    fontSize: 17,
    color: "rgba(255,255,255,0.8)",
    marginTop: spacing[6],
    lineHeight: 24,
    maxWidth: 280,
  },
  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
    marginTop: spacing[8],
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
    gap: spacing[2],
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Slide 2 content wrapper
  slide2Content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  // Slide 2 styles (Mock Device matching wireframe)
  mockDevice: {
    width: "100%",
    maxWidth: 280,
    height: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#0B6BCB",
    padding: spacing[4],
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  mockDeviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingBottom: spacing[3],
  },
  mockDeviceLogoText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0B6BCB",
    letterSpacing: 0.5,
  },
  mockGridIcon: {
    width: 28,
    height: 28,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "space-between",
    padding: 2,
    borderWidth: 2,
    borderColor: "#0B6BCB",
    borderRadius: 4,
  },
  mockGridSquare: {
    width: 10,
    height: 10,
    backgroundColor: "#0B6BCB",
  },
  mockTextLines: {
    marginTop: spacing[3],
    gap: spacing[2],
  },
  mockSquiggleLong: {
    height: 8,
    backgroundColor: "#0B6BCB",
    borderRadius: 4,
    width: "85%",
  },
  mockSquiggleShort: {
    height: 8,
    backgroundColor: "#0B6BCB",
    borderRadius: 4,
    width: "70%",
  },
  mockContentArea: {
    height: 200,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    marginTop: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: "#0B6BCB",
  },
  mockBottomBar: {
    flexDirection: "row",
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#0B6BCB",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: spacing[2],
    backgroundColor: "#FFFFFF",
  },
  mockBarDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#0B6BCB",
    opacity: 0.4,
  },
  mockIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#0B6BCB",
    justifyContent: "center",
    alignItems: "center",
  },
  mockMicCircle: {
    backgroundColor: "#0B6BCB",
  },
  mockXIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B6BCB",
  },
  mockDeviceCaption: {
    color: "#FFFFFF",
    marginTop: spacing[5],
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.9,
  },
  // Pagination
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
  // Buttons
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
});
