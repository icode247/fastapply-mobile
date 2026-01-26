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
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
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

    // UI thread index - tracks which card is active
    const activeCardIndex = useSharedValue(0);

    // Command to trigger programmatic swipes
    // index: which card to swipe
    // direction: which way to go
    const swipeCommand = useSharedValue<{
      index: number;
      direction: "left" | "right" | null;
      previousDirection?: "left" | "right";
    }>({ index: -1, direction: null });

    // Track active card's X translation to drive the *next* card's scale/opacity
    // This allows the "stack" effect to work while gestures are decoupled
    const activeTranslateX = useSharedValue(0);

    // Track card expanded state as shared value for UI thread access
    const isCardExpandedShared = useSharedValue(false);

    // Get the current and next 3 jobs
    // We keep currentIndex - 1 to allow it to finish animating out or be undone
    const visibleJobs = useMemo(() => {
      const result: { job: Job; index: number }[] = [];
      const startIdx = Math.max(0, currentIndex - 1);
      // Render slightly more cards to ensure smooth rapid changes
      for (let i = startIdx; i < Math.min(jobs.length, currentIndex + 5); i++) {
        result.push({ job: jobs[i], index: i });
      }
      return result;
    }, [jobs, currentIndex]);

    // Pre-fetch logos
    React.useEffect(() => {
      const prefetchCount = 5;
      for (let i = 0; i < prefetchCount; i++) {
        const idx = currentIndex + i;
        if (idx < jobs.length && jobs[idx].logo) {
          Image.prefetch(jobs[idx].logo).catch(() => {});
        }
      }
    }, [currentIndex, jobs]);

    const currentJob = jobs[currentIndex];

    // Callbacks for card events
    const handleSwipe = useCallback(
      (direction: "left" | "right", job: Job) => {
        // Update history and index state
        // We do this immediately to allow rapid firing
        setSwipeHistory((prev) => [...prev, { job, direction }]);
        setCurrentIndex((prev) => prev + 1);

        if (direction === "left") {
          onSwipeLeft(job);
        } else {
          onSwipeRight(job);
        }
      },
      [onSwipeLeft, onSwipeRight],
    );

    const handleExpandChange = useCallback(
      (expanded: boolean) => {
        setIsCardExpanded(expanded);
        isCardExpandedShared.value = expanded;
        onExpandChange?.(expanded);
      },
      [onExpandChange, isCardExpandedShared],
    );

    const animateSwipe = useCallback(
      (direction: "left" | "right") => {
        if (currentIndexRef.current >= jobs.length) return;

        // Trigger the command for the specific card index
        swipeCommand.value = {
          index: currentIndexRef.current,
          direction,
        };

        // Advance visual index immediately
        activeCardIndex.value = activeCardIndex.value + 1;

        // Reset the "next card" scaler since the new active card starts at 0
        activeTranslateX.value = 0;

        // Process logic
        handleSwipe(direction, jobs[currentIndexRef.current]);
      },
      [jobs, handleSwipe, activeCardIndex, swipeCommand, activeTranslateX],
    );

    const undo = useCallback(() => {
      if (swipeHistory.length === 0 || currentIndex === 0) return;

      const lastSwipe = swipeHistory[swipeHistory.length - 1];
      const previousIndex = currentIndex - 1;

      // Trigger command to bring it back (handled in CardRenderer)
      swipeCommand.value = {
        index: previousIndex,
        direction: null, // null direction implies "reset/undo"
        previousDirection: lastSwipe.direction,
      };

      // Decrement visible index
      activeCardIndex.value = previousIndex;
      activeTranslateX.value = 0;

      setSwipeHistory((prev) => prev.slice(0, -1));
      setCurrentIndex((prev) => prev - 1);
    }, [
      swipeHistory,
      currentIndex,
      activeCardIndex,
      swipeCommand,
      activeTranslateX,
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
                currentIndex={currentIndex} // Keep passing for prop calculation if needed, though mostly using shared values now
                activeCardIndex={activeCardIndex}
                activeTranslateX={activeTranslateX}
                swipeCommand={swipeCommand}
                isCardExpandedShared={isCardExpandedShared}
                onExpandChange={handleExpandChange}
                onSwipe={handleSwipe}
                onSwipingChange={onSwipingChange}
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
