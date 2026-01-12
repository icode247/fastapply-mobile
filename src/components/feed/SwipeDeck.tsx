import { Ionicons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
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

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeDeckProps {
  jobs: Job[];
  onSwipeLeft: (job: Job) => void;
  onSwipeRight: (job: Job) => void;
}

export interface SwipeDeckRef {
  swipeLeft: () => void;
  swipeRight: () => void;
  undo: () => void;
  getCurrentJob: () => Job | null;
}

export const SwipeDeck = forwardRef<SwipeDeckRef, SwipeDeckProps>(
  ({ jobs, onSwipeLeft, onSwipeRight }, ref) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swipeHistory, setSwipeHistory] = useState<
      { job: Job; direction: "left" | "right" }[]
    >([]);
    const { colors } = useTheme();

    // Animation values
    const translateX = useSharedValue(0);
    const rotate = useSharedValue(0);

    const currentJob = jobs[currentIndex];
    const nextJob = jobs[currentIndex + 1];

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

        // Reset values for next card
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
        translateX.value = withTiming(targetX, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)(direction);
        });
        rotate.value = withTiming(direction === "right" ? 15 : -15, {
          duration: 300,
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
      translateX.value = withSpring(0);
      rotate.value = withSpring(0);
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
      .onUpdate((event) => {
        translateX.value = event.translationX;
        rotate.value = (event.translationX / SCREEN_WIDTH) * 15;
      })
      .onEnd((event) => {
        if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
          const direction = event.translationX > 0 ? "right" : "left";
          const targetX =
            direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

          translateX.value = withSpring(targetX, {}, () => {
            runOnJS(handleSwipeComplete)(direction);
          });
        } else {
          translateX.value = withSpring(0);
          rotate.value = withSpring(0);
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

    // Action Badge Styles (Like/Nope overlays)
    const likeStyle = useAnimatedStyle(() => {
      return {
        opacity:
          translateX.value > 20 ? Math.min(translateX.value / 100, 1) : 0,
      };
    });

    const nopeStyle = useAnimatedStyle(() => {
      return {
        opacity:
          translateX.value < -20 ? Math.min(-translateX.value / 100, 1) : 0,
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
        {/* Background Card (Next Job) */}
        {nextJob && (
          <View style={[styles.cardContainer, styles.nextCard]}>
            <JobCard job={nextJob} />
          </View>
        )}

        {/* Foreground Card (Current Job) */}
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.cardContainer, cardStyle]}>
            {/* Overlays */}
            <Animated.View
              style={[styles.overlay, styles.likeOverlay, likeStyle]}
            >
              <Text style={styles.overlayText}>LIKE</Text>
            </Animated.View>
            <Animated.View
              style={[styles.overlay, styles.nopeOverlay, nopeStyle]}
            >
              <Text style={[styles.overlayText, styles.nopeText]}>NOPE</Text>
            </Animated.View>

            <JobCard job={currentJob} />
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
    opacity: 0.9,
    zIndex: -1,
  },
  emptyText: {
    marginTop: spacing[4],
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: spacing[2],
    fontSize: 14,
    textAlign: "center",
  },
  overlay: {
    position: "absolute",
    top: 50,
    zIndex: 100,
    borderWidth: 4,
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  likeOverlay: {
    left: 30,
    borderColor: "#00C853",
    transform: [{ rotate: "-15deg" }],
  },
  nopeOverlay: {
    right: 30,
    borderColor: "#F72585",
    transform: [{ rotate: "15deg" }],
  },
  overlayText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#00C853",
    letterSpacing: 2,
  },
  nopeText: {
    color: "#F72585",
  },
});
