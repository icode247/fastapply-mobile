import { Ionicons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Dimensions, Platform, StyleSheet, Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { spacing } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { Job } from "../../mocks/jobs";
import { JobCard } from "./JobCard";

// Android renders fonts larger, scale down for consistency
const fontScale = Platform.OS === "android" ? 0.85 : 1;

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeDeckProps {
  jobs: Job[];
  onSwipeLeft: (job: Job) => void;
  onSwipeRight: (job: Job) => void;
  onExpandChange?: (expanded: boolean) => void;
}

export interface SwipeDeckRef {
  swipeLeft: () => void;
  swipeRight: () => void;
  undo: () => void;
  getCurrentJob: () => Job | null;
}

export const SwipeDeck = forwardRef<SwipeDeckRef, SwipeDeckProps>(
  ({ jobs, onSwipeLeft, onSwipeRight, onExpandChange }, ref) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swipeHistory, setSwipeHistory] = useState<
      { job: Job; direction: "left" | "right" }[]
    >([]);
    const [isCardExpanded, setIsCardExpanded] = useState(false);
    const { colors } = useTheme();

    const handleExpandChange = (expanded: boolean) => {
      setIsCardExpanded(expanded);
      onExpandChange?.(expanded);
    };

    // Animation values
    const translateX = useSharedValue(0);
    const rotate = useSharedValue(0);

    // Pre-compute visible jobs (current + next 2 for smooth transitions)
    const visibleJobs = useMemo(() => {
      const result: { job: Job; index: number }[] = [];
      for (let i = 0; i < 3; i++) {
        const idx = currentIndex + i;
        if (idx < jobs.length) {
          result.push({ job: jobs[idx], index: idx });
        }
      }
      return result;
    }, [currentIndex, jobs]);

    const currentJob = jobs[currentIndex];

    const handleSwipeComplete = useCallback(
      (direction: "left" | "right") => {
        const job = jobs[currentIndex];

        // Save to history for undo
        setSwipeHistory((prev) => [...prev, { job, direction }]);

        if (direction === "left") {
          onSwipeLeft(job);
        } else {
          onSwipeRight(job);
        }

        // Reset values immediately for next card
        translateX.value = 0;
        rotate.value = 0;
        setCurrentIndex((prev) => prev + 1);
      },
      [currentIndex, jobs, onSwipeLeft, onSwipeRight, translateX, rotate]
    );

    const animateSwipe = useCallback(
      (direction: "left" | "right") => {
        if (currentIndex >= jobs.length) return;

        const targetX =
          direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        translateX.value = withTiming(targetX, { duration: 250 }, () => {
          runOnJS(handleSwipeComplete)(direction);
        });
        rotate.value = withTiming(direction === "right" ? 15 : -15, {
          duration: 250,
        });
      },
      [currentIndex, jobs.length, translateX, rotate, handleSwipeComplete]
    );

    const undo = useCallback(() => {
      if (swipeHistory.length === 0 || currentIndex === 0) return;

      const lastSwipe = swipeHistory[swipeHistory.length - 1];
      setSwipeHistory((prev) => prev.slice(0, -1));
      setCurrentIndex((prev) => prev - 1);

      // Animate card back from the side
      const fromX =
        lastSwipe.direction === "right"
          ? SCREEN_WIDTH * 1.5
          : -SCREEN_WIDTH * 1.5;
      translateX.value = fromX;
      rotate.value = lastSwipe.direction === "right" ? 15 : -15;
      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      rotate.value = withSpring(0, { damping: 15, stiffness: 150 });
    }, [swipeHistory, currentIndex, translateX, rotate]);

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        swipeLeft: () => animateSwipe("left"),
        swipeRight: () => animateSwipe("right"),
        undo,
        getCurrentJob: () => currentJob || null,
      }),
      [animateSwipe, undo, currentJob]
    );

    const gesture = Gesture.Pan()
      .enabled(!isCardExpanded)
      .onUpdate((event) => {
        translateX.value = event.translationX;
        rotate.value = (event.translationX / SCREEN_WIDTH) * 15;
      })
      .onEnd((event) => {
        if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
          const direction = event.translationX > 0 ? "right" : "left";
          const targetX =
            direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

          translateX.value = withSpring(targetX, { damping: 15, stiffness: 120 }, () => {
            runOnJS(handleSwipeComplete)(direction);
          });
        } else {
          translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
          rotate.value = withSpring(0, { damping: 15, stiffness: 150 });
        }
      });

    const cardStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { translateX: translateX.value },
          { rotate: `${rotate.value}deg` },
        ],
      };
    });

    // Heart icon style - shows when swiping right
    const heartIconStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        translateX.value,
        [0, 50, 100],
        [0, 0.5, 1],
        'clamp'
      );
      const scale = interpolate(
        translateX.value,
        [0, 100],
        [0.5, 1.2],
        'clamp'
      );
      return {
        opacity: translateX.value > 20 ? opacity : 0,
        transform: [{ scale }],
      };
    });

    // X icon style - shows when swiping left
    const xIconStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        translateX.value,
        [0, -50, -100],
        [0, 0.5, 1],
        'clamp'
      );
      const scale = interpolate(
        translateX.value,
        [0, -100],
        [0.5, 1.2],
        'clamp'
      );
      return {
        opacity: translateX.value < -20 ? opacity : 0,
        transform: [{ scale }],
      };
    });

    // Background card scale animation based on swipe progress
    const nextCardStyle = useAnimatedStyle(() => {
      const scale = interpolate(
        Math.abs(translateX.value),
        [0, SCREEN_WIDTH * 0.5],
        [0.96, 1],
        'clamp'
      );
      const opacity = interpolate(
        Math.abs(translateX.value),
        [0, SCREEN_WIDTH * 0.5],
        [0.7, 1],
        'clamp'
      );
      return {
        transform: [{ scale }],
        opacity,
      };
    });

    if (currentIndex >= jobs.length) {
      return (
        <View style={[styles.container, styles.center]}>
          <Ionicons
            name="checkmark-circle-outline"
            size={64}
            color={colors.success}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            You're all caught up!
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
            Check back later for new opportunities
          </Text>
        </View>
      );
    }

    return (
      <GestureHandlerRootView style={styles.container}>
        {/* Pre-render background cards (reverse order so first card is on top) */}
        {!isCardExpanded && visibleJobs.slice(1).reverse().map(({ job, index }) => (
          <Animated.View
            key={job.id}
            style={[
              styles.cardContainer,
              styles.nextCard,
              index === currentIndex + 1 && nextCardStyle,
              { zIndex: -index },
            ]}
          >
            <JobCard job={job} />
          </Animated.View>
        ))}

        {/* Foreground Card (Current Job) */}
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.cardContainer, !isCardExpanded && cardStyle]}>
            {/* Heart icon overlay - right swipe */}
            {!isCardExpanded && (
              <Animated.View style={[styles.iconOverlay, styles.heartOverlay, heartIconStyle]}>
                <Ionicons name="heart" size={80} color="#00C853" />
              </Animated.View>
            )}

            {/* X icon overlay - left swipe */}
            {!isCardExpanded && (
              <Animated.View style={[styles.iconOverlay, styles.xOverlay, xIconStyle]}>
                <Ionicons name="close" size={80} color="#F72585" />
              </Animated.View>
            )}

            <JobCard job={currentJob} onExpandChange={handleExpandChange} />
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    width: SCREEN_WIDTH * 0.95,
    height: "100%",
    position: "absolute",
  },
  nextCard: {
    transform: [{ scale: 0.96 }],
    opacity: 0.7,
  },
  emptyText: {
    marginTop: spacing[4],
    fontSize: Math.round(20 * fontScale),
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: spacing[2],
    fontSize: Math.round(14 * fontScale),
    textAlign: "center",
  },
  iconOverlay: {
    position: "absolute",
    top: "40%",
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  heartOverlay: {
    left: 40,
  },
  xOverlay: {
    right: 40,
  },
});
