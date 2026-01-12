import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { Job } from "../../mocks/jobs";

interface JobCardProps {
  job: Job;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.text,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: colors.text }]}>
            {job.title}
          </Text>
          <View
            style={[
              styles.iconButton,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Ionicons name="arrow-up-outline" size={20} color={colors.text} />
          </View>
        </View>

        <View style={styles.companyRow}>
          <Image source={{ uri: job.logo }} style={styles.logo} />
          <View>
            <Text style={[styles.company, { color: colors.text }]}>
              {job.company}
            </Text>
            <Text style={[styles.location, { color: colors.textTertiary }]}>
              {job.location}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.contentScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Compensation */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            Compensation
          </Text>
          <View style={[styles.pill, { backgroundColor: "#FFF0E6" }]}>
            <Ionicons name="wallet-outline" size={18} color="#FF5722" />
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
              <Ionicons name="business-outline" size={18} color="#009688" />
              <Text style={[styles.pillText, { color: "#009688" }]}>
                {job.workMode}
              </Text>
            </View>
            <View
              style={[
                styles.pill,
                { backgroundColor: "#F3E5F5", marginLeft: 8 },
              ]}
            >
              <Ionicons name="time-outline" size={18} color="#9C27B0" />
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
            <Ionicons name="trophy-outline" size={18} color="#E91E63" />
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
            numberOfLines={6}
          >
            {job.description}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    borderWidth: 1,
    padding: spacing[6],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
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
    fontSize: 28,
    fontWeight: "800",
    flex: 1,
    marginRight: spacing[2],
    lineHeight: 34,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing[3],
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
  section: {
    marginBottom: spacing[5],
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing[2],
    textTransform: "none",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 8,
  },
  pillText: {
    fontSize: 15,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
});
