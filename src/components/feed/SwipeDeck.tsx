import { Ionicons } from "@expo/vector-icons";
import React, {
  forwardRef,
  memo,
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
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { spacing } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { Job } from "../../mocks/jobs";
import { JobCard } from "./JobCard";

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

// Simple memoized card - only re-renders if job.id changes
const MemoizedJobCard = memo(
  ({
    job,
    onExpandChange,
  }: {
    job: Job;
    onExpandChange?: (expanded: boolean) => void;
  }) => {
    return <JobCard job={job} onExpandChange={onExpandChange} />;
  },
  (prev, next) => prev.job.id === next.job.id,
);

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
              rotate.value = withSpring(0, { damping: 15, stiffness: 200 });
            }
          }),
      [
        isCardExpandedShared,
        isProgrammaticSwipe,
        translateX,
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

// Separate component for each card to isolate animated styles
interface CardRendererProps {
  job: Job;
  jobIndex: number;
  currentIndex: number;
  activeCardIndex: SharedValue<number>;
  swipingCardIndex: SharedValue<number>;
  translateX: SharedValue<number>;
  rotate: SharedValue<number>;
  isProgrammaticSwipe: SharedValue<number>;
  gesture: ReturnType<typeof Gesture.Pan>;
  onExpandChange: (expanded: boolean) => void;
}

const CardRenderer = memo(
  ({
    job,
    jobIndex,
    currentIndex,
    activeCardIndex,
    swipingCardIndex,
    translateX,
    rotate,
    isProgrammaticSwipe,
    gesture,
    onExpandChange,
  }: CardRendererProps) => {
    // Don't use React state for top card determination - use shared value instead
    // This prevents re-renders when the card becomes active
    const stackPosition = jobIndex - currentIndex;

    // Unified card style - handles both active and next card states
    // All transitions happen via shared values on UI thread, no React re-renders
    const cardStyle = useAnimatedStyle(() => {
      const diff = jobIndex - activeCardIndex.value;
      const isBeingSwiped = swipingCardIndex.value === jobIndex;

      // Card is swiped away (behind active) - hide it
      if (diff < 0) {
        return {
          opacity: 0,
          transform: [{ translateX: 0 }, { rotate: "0deg" }, { scale: 1 }],
        };
      }

      // This is the active card (diff === 0)
      if (diff === 0) {
        // Apply transforms only when this specific card is being swiped
        if (isBeingSwiped) {
          return {
            opacity: 1,
            transform: [
              { translateX: translateX.value },
              { rotate: `${rotate.value}deg` },
              { scale: 1 },
            ],
          };
        }
        // Card just became active - show at rest position immediately
        return {
          opacity: 1,
          transform: [{ translateX: 0 }, { rotate: "0deg" }, { scale: 1 }],
        };
      }

      // This is the next card (diff === 1)
      if (diff === 1) {
        // Only animate scale/opacity when the ACTIVE card is being swiped
        const activeIsBeingSwiped = swipingCardIndex.value === activeCardIndex.value;

        if (!activeIsBeingSwiped) {
          // No swipe in progress - stay at rest
          return {
            opacity: 0.7,
            transform: [{ translateX: 0 }, { rotate: "0deg" }, { scale: 0.96 }],
          };
        }

        const absTranslateX = Math.abs(translateX.value);

        // Scale up as the active card swipes away
        const scale = interpolate(
          absTranslateX,
          [0, SCREEN_WIDTH * 0.5],
          [0.96, 1],
          "clamp",
        );
        const opacity = interpolate(
          absTranslateX,
          [0, SCREEN_WIDTH * 0.5],
          [0.7, 1],
          "clamp",
        );
        return {
          opacity,
          transform: [{ translateX: 0 }, { rotate: "0deg" }, { scale }],
        };
      }

      // Cards further back - hidden
      return {
        opacity: 0,
        transform: [{ translateX: 0 }, { rotate: "0deg" }, { scale: 0.96 }],
      };
    }, [jobIndex]);

    // Check if this is the active card on UI thread
    const isActive = useDerivedValue(() => {
      return activeCardIndex.value === jobIndex;
    }, [jobIndex]);

    // Heart icon style (for hand swipes)
    const heartIconStyle = useAnimatedStyle(() => {
      if (isProgrammaticSwipe.value === 1 || !isActive.value) {
        return { opacity: 0, transform: [{ scale: 0 }] };
      }
      const opacity = interpolate(
        translateX.value,
        [0, 50, 100],
        [0, 0.5, 1],
        "clamp",
      );
      const scale = interpolate(
        translateX.value,
        [0, 100],
        [0.5, 1.2],
        "clamp",
      );
      return {
        opacity: translateX.value > 20 ? opacity : 0,
        transform: [{ scale }],
      };
    }, []);

    // X icon style (for hand swipes)
    const xIconStyle = useAnimatedStyle(() => {
      if (isProgrammaticSwipe.value === 1 || !isActive.value) {
        return { opacity: 0, transform: [{ scale: 0 }] };
      }
      const opacity = interpolate(
        translateX.value,
        [0, -50, -100],
        [0, 0.5, 1],
        "clamp",
      );
      const scale = interpolate(
        translateX.value,
        [0, -100],
        [0.5, 1.2],
        "clamp",
      );
      return {
        opacity: translateX.value < -20 ? opacity : 0,
        transform: [{ scale }],
      };
    }, []);

    // LIKE text style (for button swipes)
    const likeTextStyle = useAnimatedStyle(() => {
      if (isProgrammaticSwipe.value === 0 || !isActive.value) {
        return { opacity: 0, transform: [{ scale: 0 }] };
      }
      const opacity = interpolate(
        translateX.value,
        [0, 50, 100],
        [0, 0.5, 1],
        "clamp",
      );
      const scale = interpolate(
        translateX.value,
        [0, 100],
        [0.5, 1.2],
        "clamp",
      );
      return {
        opacity: translateX.value > 20 ? opacity : 0,
        transform: [{ scale }],
      };
    }, []);

    // NOPE text style (for button swipes)
    const nopeTextStyle = useAnimatedStyle(() => {
      if (isProgrammaticSwipe.value === 0 || !isActive.value) {
        return { opacity: 0, transform: [{ scale: 0 }] };
      }
      const opacity = interpolate(
        translateX.value,
        [0, -50, -100],
        [0, 0.5, 1],
        "clamp",
      );
      const scale = interpolate(
        translateX.value,
        [0, -100],
        [0.5, 1.2],
        "clamp",
      );
      return {
        opacity: translateX.value < -20 ? opacity : 0,
        transform: [{ scale }],
      };
    }, []);

    // Don't render cards that are swiped away (based on React state)
    if (stackPosition < 0) {
      return null;
    }

    // Don't render cards too far back
    if (stackPosition > 2) {
      return null;
    }

    // Determine if this card should be interactive (only top card based on React state)
    const isTopCard = stackPosition === 0;

    // Single unified render - all cards rendered the same way
    // cardStyle handles opacity, scale, and transform based on activeCardIndex shared value
    return (
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.cardContainer,
            cardStyle,
            { zIndex: 100 - stackPosition },
          ]}
          pointerEvents={isTopCard ? "auto" : "none"}
        >
          {/* Swipe indicators - only shown on active card via animated styles */}
          <Animated.View
            style={[styles.iconOverlay, styles.heartOverlay, heartIconStyle]}
          >
            <Ionicons name="heart" size={80} color="#00C853" />
          </Animated.View>
          <Animated.View
            style={[styles.iconOverlay, styles.xOverlay, xIconStyle]}
          >
            <Ionicons name="close" size={80} color="#F72585" />
          </Animated.View>
          <Animated.View
            style={[styles.iconOverlay, styles.heartOverlay, likeTextStyle]}
          >
            <View style={styles.likeContainer}>
              <Text style={styles.likeText}>LIKE</Text>
            </View>
          </Animated.View>
          <Animated.View
            style={[styles.iconOverlay, styles.xOverlay, nopeTextStyle]}
          >
            <View style={styles.nopeContainer}>
              <Text style={styles.nopeText}>NOPE</Text>
            </View>
          </Animated.View>
          <MemoizedJobCard
            job={job}
            onExpandChange={isTopCard ? onExpandChange : undefined}
          />
        </Animated.View>
      </GestureDetector>
    );
  },
  (prev, next) => {
    // Minimize re-renders - only re-render if job changes or stack position changes significantly
    const prevStack = prev.jobIndex - prev.currentIndex;
    const nextStack = next.jobIndex - next.currentIndex;

    // Same job, same relative position = don't re-render
    return prev.job.id === next.job.id && prevStack === nextStack;
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
  likeContainer: {
    borderWidth: 4,
    borderColor: "#00C853",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    transform: [{ rotate: "-15deg" }],
  },
  likeText: {
    fontSize: Math.round(32 * fontScale),
    fontWeight: "900",
    color: "#00C853",
    letterSpacing: 2,
  },
  nopeContainer: {
    borderWidth: 4,
    borderColor: "#F72585",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    transform: [{ rotate: "15deg" }],
  },
  nopeText: {
    fontSize: Math.round(32 * fontScale),
    fontWeight: "900",
    color: "#F72585",
    letterSpacing: 2,
  },
});
