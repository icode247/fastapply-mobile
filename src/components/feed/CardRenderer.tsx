import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Dimensions, Platform, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import { Job } from "../../mocks/jobs";
import { JobCard } from "./JobCard";

const fontScale = Platform.OS === "android" ? 0.85 : 1;
const SCREEN_WIDTH = Dimensions.get("window").width;

// Reuse the MemoizedJobCard logic here
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

export interface CardRendererProps {
  job: Job;
  jobIndex: number;
  currentIndex: number;
  activeCardIndex: SharedValue<number>;
  swipingCardIndex: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  rotate: SharedValue<number>;
  isProgrammaticSwipe: SharedValue<number>;
  gesture: ReturnType<typeof Gesture.Pan>;

  onExpandChange: (expanded: boolean) => void;
}

export const CardRenderer = memo(
  ({
    job,
    jobIndex,
    currentIndex,
    activeCardIndex,
    swipingCardIndex,
    translateX,
    translateY,
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
          transform: [
            { translateX: 0 },
            { translateY: 0 },
            { rotate: "0deg" },
            { scale: 1 },
          ],
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
              { translateY: translateY.value },
              { rotate: `${rotate.value}deg` },
              { scale: 1 },
            ],
          };
        }
        // Card just became active - show at rest position immediately
        return {
          opacity: 1,
          transform: [
            { translateX: 0 },
            { translateY: 0 },
            { rotate: "0deg" },
            { scale: 1 },
          ],
        };
      }

      // This is the next card (diff === 1)
      if (diff === 1) {
        // Only animate scale/opacity when the ACTIVE card is being swiped
        const activeIsBeingSwiped =
          swipingCardIndex.value === activeCardIndex.value;

        if (!activeIsBeingSwiped) {
          // No swipe in progress - stay at rest
          return {
            opacity: 0.7,
            transform: [
              { translateX: 0 },
              { translateY: 0 },
              { rotate: "0deg" },
              { scale: 0.96 },
            ],
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
          transform: [
            { translateX: 0 },
            { translateY: 0 },
            { rotate: "0deg" },
            { scale },
          ],
        };
      }

      // Cards further back - hidden
      return {
        opacity: 0,
        transform: [
          { translateX: 0 },
          { translateY: 0 },
          { rotate: "0deg" },
          { scale: 0.96 },
        ],
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
