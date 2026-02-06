import { Ionicons } from "@expo/vector-icons";
import { memo, useMemo } from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { Text } from "../ui/Text";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { NormalizedJob } from "../../types/job.types";
import { JobCard } from "./JobCard";

const fontScale = Platform.OS === "android" ? 0.85 : 1;
const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Reuse the MemoizedJobCard logic here
const MemoizedJobCard = memo(
  ({
    job,
    onExpandChange,
  }: {
    job: NormalizedJob;
    onExpandChange?: (expanded: boolean) => void;
  }) => {
    return <JobCard job={job} onExpandChange={onExpandChange} />;
  },
  (prev, next) => prev.job.id === next.job.id,
);

export interface CardRendererProps {
  job: NormalizedJob;
  jobIndex: number;
  currentIndex: number;
  activeCardIndex: SharedValue<number>;
  activeTranslateX: SharedValue<number>;
  swipeCommand: SharedValue<{
    index: number;
    direction: "left" | "right" | null;
    previousDirection?: "left" | "right";
  }>;
  isCardExpandedShared: SharedValue<boolean>;
  onExpandChange: (expanded: boolean) => void;
  onSwipe: (direction: "left" | "right", job: NormalizedJob) => void;
  onSwipingChange?: (isSwiping: boolean) => void;
}

export const CardRenderer = memo(
  ({
    job,
    jobIndex,
    currentIndex,
    activeCardIndex,
    activeTranslateX,
    swipeCommand,
    isCardExpandedShared,
    onExpandChange,
    onSwipe,
    onSwipingChange,
  }: CardRendererProps) => {
    // Local animation state (independent for each card)
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const rotate = useSharedValue(0);
    const isProgrammaticSwipe = useSharedValue(0);

    const stackPosition = jobIndex - currentIndex;
    const isActive = useDerivedValue(
      () => activeCardIndex.value === jobIndex,
      [jobIndex],
    );

    // Handle programmatic swipes (buttons)
    useAnimatedReaction(
      () => swipeCommand.value,
      (command) => {
        if (command.index === jobIndex) {
          if (command.direction === null) {
            // Undo / Reset
            // If we are undoing, we need to start from where we left to animate IN
            if (command.previousDirection) {
              const startX =
                command.previousDirection === "right"
                  ? SCREEN_WIDTH * 1.5
                  : -SCREEN_WIDTH * 1.5;
              const startRotate =
                command.previousDirection === "right" ? 10 : -10;
              translateX.value = startX;
              rotate.value = startRotate;
            }

            translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
            translateY.value = withSpring(0);
            rotate.value = withSpring(0);
            isProgrammaticSwipe.value = 0;
            return;
          }

          // Trigger swipe out
          isProgrammaticSwipe.value = 1;
          const targetX =
            command.direction === "right"
              ? SCREEN_WIDTH * 1.5
              : -SCREEN_WIDTH * 1.5;
          const rotateTarget = command.direction === "right" ? 10 : -10;

          translateX.value = withSpring(targetX, {
            damping: 28,
            stiffness: 65,
            velocity: command.direction === "right" ? 800 : -800,
          });
          rotate.value = withSpring(rotateTarget);
        }
      },
    );

    // Gesture Handler
    const gesture = useMemo(
      () =>
        Gesture.Pan()
          .enabled(stackPosition === 0) // Only top card is swipeable
          .onStart(() => {
            if (isCardExpandedShared.value) return;
            if (!isActive.value) return;
            isProgrammaticSwipe.value = 0;
            if (onSwipingChange) runOnJS(onSwipingChange)(true);
          })
          .onUpdate((event) => {
            if (isCardExpandedShared.value) return;
            if (!isActive.value) return;

            translateX.value = event.translationX * 0.92;
            translateY.value = event.translationY;
            rotate.value = (event.translationX / SCREEN_WIDTH) * 12;

            // Sync with parent for stack animation
            activeTranslateX.value = event.translationX;
          })
          .onEnd((event) => {
            if (isCardExpandedShared.value) return;
            if (!isActive.value) return;

            if (onSwipingChange) runOnJS(onSwipingChange)(false);

            if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
              const direction = event.translationX > 0 ? "right" : "left";
              const targetX =
                direction === "right"
                  ? SCREEN_WIDTH * 1.5
                  : -SCREEN_WIDTH * 1.5;

              // Optimistically update UI state immediately
              runOnJS(onSwipe)(direction, job);

              // Animate off screen
              translateX.value = withSpring(targetX, {
                velocity: event.velocityX,
                damping: 28,
                stiffness: 65,
              });

              // Reset parent immediately so next card snaps to center
              activeTranslateX.value = 0;

              // Animate actual index update for next card access
              activeCardIndex.value = activeCardIndex.value + 1;
            } else {
              // Reset / Snap back
              translateX.value = withSpring(0);
              translateY.value = withSpring(0);
              rotate.value = withSpring(0);
              activeTranslateX.value = withSpring(0);
            }
          }),
      [
        job,
        jobIndex,
        onSwipe,
        isActive,
        isCardExpandedShared,
        activeTranslateX,
        activeCardIndex,
        currentIndex,
      ],
    );

    const cardStyle = useAnimatedStyle(() => {
      // If this is the active card, use local physics
      if (isActive.value) {
        return {
          zIndex: 1000, // Force active card to top
          opacity: 1,
          transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotate: `${rotate.value}deg` },
            { scale: 1 },
          ],
        };
      }

      const diff = jobIndex - activeCardIndex.value;

      // If this card is "swiped" (index < active), it should be animating out or gone
      if (jobIndex < activeCardIndex.value) {
        // If it still has significant translation, keep it on top (it's effectively "active" in animation)
        const isExiting = Math.abs(translateX.value) > 10;
        return {
          zIndex: isExiting ? 1000 : 100 - diff, // Maintain stacking order for swiped cards
          opacity: 1, // Keep visible while animating out
          transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotate: `${rotate.value}deg` },
            { scale: 1 },
          ],
        };
      }

      // If this is the next card (active + 1), react to the active card's movement
      if (jobIndex === activeCardIndex.value + 1) {
        const absTranslateX = Math.abs(activeTranslateX.value);
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
          zIndex: 100 - diff,
          opacity,
          transform: [
            { translateX: 0 },
            { translateY: 0 },
            { rotate: "0deg" },
            { scale },
          ],
        };
      }

      // Cards further back
      return {
        zIndex: 100 - diff,
        opacity: 0,
        transform: [{ scale: 0.96 }],
      };
    });

    const heartIconStyle = useAnimatedStyle(() => {
      // Button click = show icon, Hand swipe = hide icon
      if (isProgrammaticSwipe.value === 0)
        return { opacity: 0, transform: [{ scale: 0 }] };

      const x = translateX.value;
      if (x > 20) {
        return {
          opacity: interpolate(x, [0, 50, 100], [0, 0.5, 1], "clamp"),
          transform: [{ scale: interpolate(x, [0, 100], [0.5, 1.2], "clamp") }],
        };
      }
      return { opacity: 0, transform: [{ scale: 0 }] };
    });

    const xIconStyle = useAnimatedStyle(() => {
      // Button click = show icon, Hand swipe = hide icon
      if (isProgrammaticSwipe.value === 0)
        return { opacity: 0, transform: [{ scale: 0 }] };

      const x = translateX.value;
      if (x < -20) {
        return {
          opacity: interpolate(x, [0, -50, -100], [0, 0.5, 1], "clamp"),
          transform: [
            { scale: interpolate(x, [0, -100], [0.5, 1.2], "clamp") },
          ],
        };
      }
      return { opacity: 0, transform: [{ scale: 0 }] };
    });

    const likeTextStyle = useAnimatedStyle(() => {
      // Hand swipe = show text, Button click = hide text
      if (isProgrammaticSwipe.value === 1)
        return { opacity: 0, transform: [{ scale: 0 }] };

      const x = translateX.value;
      if (x > 20) {
        return {
          opacity: interpolate(x, [0, 50, 100], [0, 0.5, 1], "clamp"),
          transform: [{ scale: interpolate(x, [0, 100], [0.5, 1.2], "clamp") }],
        };
      }
      return { opacity: 0, transform: [{ scale: 0 }] };
    });

    const nopeTextStyle = useAnimatedStyle(() => {
      // Hand swipe = show text, Button click = hide text
      if (isProgrammaticSwipe.value === 1)
        return { opacity: 0, transform: [{ scale: 0 }] };

      const x = translateX.value;
      if (x < -20) {
        return {
          opacity: interpolate(x, [0, -50, -100], [0, 0.5, 1], "clamp"),
          transform: [
            { scale: interpolate(x, [0, -100], [0.5, 1.2], "clamp") },
          ],
        };
      }
      return { opacity: 0, transform: [{ scale: 0 }] };
    });

    // Don't render cards that are too far gone
    if (stackPosition < -1) return null;
    if (stackPosition > 2) return null;

    const isSwipeable = stackPosition === 0;

    return (
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.cardContainer, cardStyle]}>
          {/* Overlays */}
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
            onExpandChange={isSwipeable ? onExpandChange : undefined}
          />
        </Animated.View>
      </GestureDetector>
    );
  },
  (prev, next) => {
    // Only re-render if identity changes or big stack shifts
    // We want to avoid re-rendering just because shared values changed
    return (
      prev.job.id === next.job.id &&
      prev.jobIndex === next.jobIndex &&
      prev.currentIndex === next.currentIndex
    );
  },
);

const styles = StyleSheet.create({
  cardContainer: {
    width: SCREEN_WIDTH * 0.95,
    height: "100%",
    position: "absolute",
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
