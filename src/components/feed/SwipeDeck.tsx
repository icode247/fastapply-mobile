import { Ionicons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import { runOnJS, useSharedValue, withSpring } from "react-native-reanimated";
import { spacing } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { Job } from "../../mocks/jobs";
import { CardRenderer } from "./CardRenderer";

const fontScale = Platform.OS === "android" ? 0.85 : 1;
const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeDeckProps {
  jobs: Job[];
  onSwipeLeft: (job: Job) => void;
  onSwipeRight: (job: Job) => void;
  onExpandChange?: (expanded: boolean) => void;
  onSwipingChange?: (isSwiping: boolean) => void;
}

export interface SwipeDeckRef {
  swipeLeft: () => void;
  swipeRight: () => void;
  undo: () => void;
  getCurrentJob: () => Job | null;
}

export const SwipeDeck = forwardRef<SwipeDeckRef, SwipeDeckProps>(
  (
    { jobs, onSwipeLeft, onSwipeRight, onExpandChange, onSwipingChange },
    ref,
  ) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swipeHistory, setSwipeHistory] = useState<
      { job: Job; direction: "left" | "right" }[]
    >([]);
    const [isCardExpanded, setIsCardExpanded] = useState(false);
    const { colors } = useTheme();

    const currentIndexRef = useRef(currentIndex);
    currentIndexRef.current = currentIndex;

    // Refs for callbacks to keep gesture stable
    const handleSwipeCompleteRef = useRef<
      (direction: "left" | "right") => void
    >(() => {});
    const notifySwipingStartRef = useRef<() => void>(() => {});
    const notifySwipingEndRef = useRef<() => void>(() => {});

    // Animation values
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const rotate = useSharedValue(0);
    const isProgrammaticSwipe = useSharedValue(0);

    // UI thread index - tracks which card is active, updates BEFORE React state
    const activeCardIndex = useSharedValue(0);

    // Tracks which card index is currently being animated (for swipe animations)
    // -1 means no swipe in progress
    const swipingCardIndex = useSharedValue(-1);

    // Track card expanded state as shared value for UI thread access
    const isCardExpandedShared = useSharedValue(false);

    // Get the current and next 3 jobs (one extra for smoother transitions)
    const visibleJobs = useMemo(() => {
      const result: { job: Job; index: number }[] = [];
      // Include one card BEFORE current (for undo) and 3 after
      const startIdx = Math.max(0, currentIndex - 1);
      for (let i = startIdx; i < Math.min(jobs.length, currentIndex + 4); i++) {
        result.push({ job: jobs[i], index: i });
      }
      return result;
    }, [jobs, currentIndex]);

    // Pre-fetch logos for upcoming cards (next 5) to prevent CLS
    React.useEffect(() => {
      const prefetchCount = 5;
      for (let i = 0; i < prefetchCount; i++) {
        const idx = currentIndex + i;
        if (idx < jobs.length && jobs[idx].logo) {
          Image.prefetch(jobs[idx].logo).catch(() => {});
        }
      }
    }, [currentIndex, jobs]);

    // Note: activeCardIndex is now updated in handleSwipeComplete before React state changes
    // This ensures proper ordering: reset translateX → advance index → update React state

    const currentJob = jobs[currentIndex];

    const handleExpandChange = useCallback(
      (expanded: boolean) => {
        setIsCardExpanded(expanded);
        isCardExpandedShared.value = expanded;
        onExpandChange?.(expanded);
      },
      [onExpandChange, isCardExpandedShared],
    );

    const handleSwipeComplete = useCallback(
      (direction: "left" | "right") => {
        const idx = currentIndexRef.current;
        const job = jobs[idx];

        // Reset animation values FIRST while the old card is still "active"
        // This ensures clean state before transitioning
        translateX.value = 0;
        translateY.value = 0;
        rotate.value = 0;
        isProgrammaticSwipe.value = 0;
        swipingCardIndex.value = -1;

        // NOW advance the index - new card becomes active and sees clean values
        activeCardIndex.value = activeCardIndex.value + 1;

        // Update React state last - this is just for component re-renders
        setSwipeHistory((prev) => [...prev, { job, direction }]);
        setCurrentIndex((prev) => prev + 1);

        if (direction === "left") {
          onSwipeLeft(job);
        } else {
          onSwipeRight(job);
        }
      },
      [
        jobs,
        onSwipeLeft,
        onSwipeRight,
        translateX,
        rotate,
        isProgrammaticSwipe,
        activeCardIndex,
        swipingCardIndex,
      ],
    );
    handleSwipeCompleteRef.current = handleSwipeComplete;

    const animateSwipe = useCallback(
      (direction: "left" | "right") => {
        if (currentIndexRef.current >= jobs.length) return;

        isProgrammaticSwipe.value = 1;
        swipingCardIndex.value = currentIndexRef.current;
        const targetX =
          direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

        translateX.value = withSpring(
          targetX,
          {
            damping: 28,
            stiffness: 65,
            velocity: direction === "right" ? 350 : -350,
            overshootClamping: true,
          },
          (finished) => {
            if (finished) {
              runOnJS(handleSwipeComplete)(direction);
            }
          },
        );
        rotate.value = withSpring(direction === "right" ? 10 : -10, {
          damping: 28,
          stiffness: 65,
        });
      },
      [
        jobs.length,
        translateX,
        rotate,
        isProgrammaticSwipe,
        handleSwipeComplete,
        swipingCardIndex,
      ],
    );

    const undo = useCallback(() => {
      if (swipeHistory.length === 0 || currentIndex === 0) return;

      const lastSwipe = swipeHistory[swipeHistory.length - 1];
      const previousIndex = currentIndex - 1;

      // Set the card we're undoing to as being "swiped" so it can animate
      swipingCardIndex.value = previousIndex;

      // Decrement active index first
      activeCardIndex.value = previousIndex;

      setSwipeHistory((prev) => prev.slice(0, -1));
      setCurrentIndex((prev) => prev - 1);

      const fromX =
        lastSwipe.direction === "right"
          ? SCREEN_WIDTH * 1.5
          : -SCREEN_WIDTH * 1.5;
      translateX.value = fromX;
      translateY.value = 0;
      rotate.value = lastSwipe.direction === "right" ? 10 : -10;

      translateX.value = withSpring(
        0,
        {
          damping: 22,
          stiffness: 120,
          velocity: lastSwipe.direction === "right" ? -300 : 300,
        },
        () => {
          // Animation complete, clear swiping state
          swipingCardIndex.value = -1;
        },
      );
      rotate.value = withSpring(0, { damping: 22, stiffness: 120 });
    }, [
      swipeHistory,
      currentIndex,
      translateX,
      rotate,
      activeCardIndex,
      swipingCardIndex,
      translateY,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        swipeLeft: () => animateSwipe("left"),
        swipeRight: () => animateSwipe("right"),
        undo,
        getCurrentJob: () => currentJob || null,
      }),
      [animateSwipe, undo, currentJob],
    );

    const notifySwipingStart = useCallback(() => {
      onSwipingChange?.(true);
    }, [onSwipingChange]);
    notifySwipingStartRef.current = notifySwipingStart;

    const notifySwipingEnd = useCallback(() => {
      onSwipingChange?.(false);
    }, [onSwipingChange]);
    notifySwipingEndRef.current = notifySwipingEnd;

    // Wrapper functions that call through refs - allows gesture to stay stable
    const callSwipingStart = useCallback(() => {
      notifySwipingStartRef.current();
    }, []);

    const callSwipingEnd = useCallback(() => {
      notifySwipingEndRef.current();
    }, []);

    const callSwipeComplete = useCallback((direction: "left" | "right") => {
      handleSwipeCompleteRef.current(direction);
    }, []);

    // Gesture handler - stable reference, uses shared values for all dynamic state
    // This prevents Reanimated warning about modifying gesture handlerTag
    const gesture = useMemo(
      () =>
        Gesture.Pan()
          .onStart(() => {
            // Check if card is expanded on UI thread - if so, ignore gesture
            if (isCardExpandedShared.value) return;
            isProgrammaticSwipe.value = 0;
            swipingCardIndex.value = activeCardIndex.value;
            runOnJS(callSwipingStart)();
          })
          .onUpdate((event) => {
            // Skip if card is expanded
            if (isCardExpandedShared.value) return;
            translateX.value = event.translationX * 0.92;
            translateY.value = event.translationY;
            rotate.value = (event.translationX / SCREEN_WIDTH) * 12;
          })
          .onEnd((event) => {
            // Skip if card is expanded
            if (isCardExpandedShared.value) return;
            runOnJS(callSwipingEnd)();

            if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
              const direction = event.translationX > 0 ? "right" : "left";
              const targetX =
                direction === "right"
                  ? SCREEN_WIDTH * 1.5
                  : -SCREEN_WIDTH * 1.5;
              const velocityFactor = Math.min(
                Math.abs(event.velocityX) / 1000,
                1,
              );
              const smoothVelocity =
                (direction === "right" ? 400 : -400) *
                (0.5 + velocityFactor * 0.5);

              translateX.value = withSpring(
                targetX,
                {
                  damping: 28,
                  stiffness: 65,
                  velocity: smoothVelocity,
                  overshootClamping: true,
                },
                (finished) => {
                  if (finished) {
                    runOnJS(callSwipeComplete)(direction);
                  }
                },
              );
              // Spring back translateY to 0 when swiping out
              translateY.value = withSpring(0, {
                damping: 28,
                stiffness: 65,
              });
              rotate.value = withSpring(direction === "right" ? 10 : -10, {
                damping: 28,
                stiffness: 65,
              });
            } else {
              // Snap back - clear swiping state
              swipingCardIndex.value = -1;
              translateX.value = withSpring(0, {
                damping: 15,
                stiffness: 200,
                velocity: -event.velocityX * 0.3,
              });
              translateY.value = withSpring(0, {
                damping: 15,
                stiffness: 200,
                velocity: -event.velocityY * 0.3,
              });
              rotate.value = withSpring(0, { damping: 15, stiffness: 200 });
            }
          }),
      [
        isCardExpandedShared,
        isProgrammaticSwipe,
        translateX,
        translateY,
        rotate,
        callSwipingStart,
        callSwipingEnd,
        callSwipeComplete,
        swipingCardIndex,
        activeCardIndex,
      ],
    );

    // Empty state
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
        {/* Render cards in reverse order so first card is on top */}
        {!isCardExpanded &&
          visibleJobs
            .slice()
            .reverse()
            .map(({ job, index }) => (
              <CardRenderer
                key={job.id}
                job={job}
                jobIndex={index}
                currentIndex={currentIndex}
                activeCardIndex={activeCardIndex}
                swipingCardIndex={swipingCardIndex}
                translateX={translateX}
                translateY={translateY}
                rotate={rotate}
                isProgrammaticSwipe={isProgrammaticSwipe}
                gesture={gesture}
                onExpandChange={handleExpandChange}
              />
            ))}
      </GestureHandlerRootView>
    );
  },
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
});
