import { Ionicons } from "@expo/vector-icons";
import React, { memo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { NormalizedJob } from "../../types/job.types";

// Android renders fonts/icons larger, scale down for consistency
const fontScale = Platform.OS === "android" ? 0.85 : 1;
const iconSize = Math.round(18 * fontScale);
const smallIconSize = Math.round(20 * fontScale);

interface JobCardProps {
  job: NormalizedJob;
  onExpandChange?: (expanded: boolean) => void;
}

const JobCardComponent: React.FC<JobCardProps> = ({ job, onExpandChange }) => {
  const { colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    const newExpanded = !isExpanded;
    Animated.timing(rotateAnim, {
      toValue,
      duration: 400,
      useNativeDriver: true,
    }).start();
    setIsExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  };

  const arrowRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "0deg"],
  });

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isExpanded ? "transparent" : colors.border,
          shadowColor: isExpanded ? "transparent" : colors.text,
          borderRadius: isExpanded ? 0 : 32,
          borderWidth: isExpanded ? 0 : 1,
          elevation: isExpanded ? 0 : 8,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: colors.text }]}>
            {job.title}
          </Text>
          <TouchableOpacity
            onPress={toggleExpand}
            activeOpacity={0.7}
            style={[
              styles.iconButton,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
              <Ionicons
                name="chevron-down"
                size={smallIconSize}
                color={colors.text}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.companyRow}>
          {/* Logo container with fixed dimensions and placeholder to prevent CLS */}
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Image
              source={{ uri: job.logo, cache: "force-cache" }}
              style={styles.logo}
              fadeDuration={0}
            />
          </View>
          <View style={styles.companyInfo}>
            <Text
              style={[styles.company, { color: colors.text }]}
              numberOfLines={1}
            >
              {job.company}
            </Text>
            <Text
              style={[styles.location, { color: colors.textTertiary }]}
              numberOfLines={1}
            >
              {job.location}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={isExpanded ? styles.expandedContent : undefined}
        showsVerticalScrollIndicator={isExpanded}
        scrollEnabled={isExpanded}
        bounces={isExpanded}
        removeClippedSubviews={!isExpanded} // Optimize off-screen content
      >
        {/* Compensation */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Compensation
          </Text>
          <View style={[styles.pill, { backgroundColor: "#FFF0E6" }]}>
            <Ionicons name="wallet-outline" size={iconSize} color="#FF5722" />
            <Text style={[styles.pillText, { color: "#FF5722" }]}>
              {job.salary}
            </Text>
          </View>
        </View>

        {/* Work Arrangement */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Work arrangement
          </Text>
          <View style={styles.row}>
            <View style={[styles.pill, { backgroundColor: "#E0F2F1" }]}>
              <Ionicons
                name="business-outline"
                size={iconSize}
                color="#009688"
              />
              <Text style={[styles.pillText, { color: "#009688" }]}>
                {job.workMode}
              </Text>
            </View>
            <View
              style={[
                styles.pill,
                { backgroundColor: "#F3E5F5" },
              ]}
            >
              <Ionicons name="time-outline" size={iconSize} color="#9C27B0" />
              <Text style={[styles.pillText, { color: "#9C27B0" }]}>
                {job.type}
              </Text>
            </View>
          </View>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Experience level
          </Text>
          <View style={[styles.pill, { backgroundColor: "#FCE4EC" }]}>
            <Ionicons name="trophy-outline" size={iconSize} color="#E91E63" />
            <Text style={[styles.pillText, { color: "#E91E63" }]}>
              {job.experience}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Job description
          </Text>
          <Text
            style={[styles.description, { color: colors.text }]}
            numberOfLines={isExpanded ? undefined : 6}
          >
            {job.description}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

// Memoize to prevent re-renders when parent re-renders
// Only re-render if job.id changes
export const JobCard = memo(JobCardComponent, (prevProps, nextProps) => {
  return prevProps.job.id === nextProps.job.id;
});

const styles = StyleSheet.create({
  card: {
    // width: "100%",
    height: "100%",
    padding: spacing[6],
    margin: spacing[2],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardHeader: {
    marginBottom: spacing[4],
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[4],
  },
  title: {
    fontSize: Math.round(28 * fontScale),
    fontWeight: "800",
    flex: 1,
    marginRight: spacing[2],
    lineHeight: Math.round(34 * fontScale),
  },
  iconButton: {
    width: Math.round(36 * fontScale),
    height: Math.round(36 * fontScale),
    borderRadius: Math.round(18 * fontScale),
    justifyContent: "center",
    alignItems: "center",
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: Math.round(48 * fontScale),
    height: Math.round(48 * fontScale),
    borderRadius: Math.round(24 * fontScale),
    marginRight: spacing[3],
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  companyInfo: {
    flex: 1,
  },
  company: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    marginBottom: 2,
  },
  location: {
    fontSize: typography.fontSize.base,
  },
  contentScroll: {
    flex: 1,
  },
  expandedContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionLabel: {
    fontSize: Math.round(13 * fontScale),
    fontWeight: "600",
    marginBottom: spacing[3],
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 8,
  },
  pillText: {
    fontSize: Math.round(15 * fontScale),
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  description: {
    fontSize: Math.round(15 * fontScale),
    lineHeight: Math.round(24 * fontScale),
    paddingTop: spacing[1],
  },
});
