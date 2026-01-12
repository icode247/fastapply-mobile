import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { Job } from "../../mocks/jobs";

interface JobDetailsModalProps {
  visible: boolean;
  job: Job | null;
  onClose: () => void;
  onApply: (job: Job) => void;
  onReject: (job: Job) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  visible,
  job,
  onClose,
  onApply,
  onReject,
}) => {
  const { colors } = useTheme();

  if (!job) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="chevron-down" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Job Details
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Company Info */}
          <View style={styles.companySection}>
            <Image source={{ uri: job.logo }} style={styles.logo} />
            <View style={styles.companyInfo}>
              <Text style={[styles.companyName, { color: colors.text }]}>
                {job.company}
              </Text>
              <Text style={[styles.location, { color: colors.textSecondary }]}>
                {job.location}
              </Text>
            </View>
          </View>

          {/* Job Title */}
          <Text style={[styles.jobTitle, { color: colors.text }]}>
            {job.title}
          </Text>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, { backgroundColor: "#FFF0E6" }]}>
              <Ionicons name="wallet-outline" size={16} color="#FF5722" />
              <Text style={[styles.tagText, { color: "#FF5722" }]}>
                {job.salary}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: "#E0F2F1" }]}>
              <Ionicons name="business-outline" size={16} color="#009688" />
              <Text style={[styles.tagText, { color: "#009688" }]}>
                {job.workMode}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: "#F3E5F5" }]}>
              <Ionicons name="time-outline" size={16} color="#9C27B0" />
              <Text style={[styles.tagText, { color: "#9C27B0" }]}>
                {job.type}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: "#FCE4EC" }]}>
              <Ionicons name="trophy-outline" size={16} color="#E91E63" />
              <Text style={[styles.tagText, { color: "#E91E63" }]}>
                {job.experience}
              </Text>
            </View>
          </View>

          {/* Posted */}
          <Text style={[styles.postedAt, { color: colors.textTertiary }]}>
            Posted {job.postedAt}
          </Text>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              About the Role
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {job.description}
            </Text>
          </View>

          {/* Skills */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Skills Required
            </Text>
            <View style={styles.skillsContainer}>
              {job.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[
                    styles.skillTag,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                >
                  <Text style={[styles.skillText, { color: colors.text }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.rejectButton, { borderColor: colors.border }]}
            onPress={() => {
              onReject(job);
              onClose();
            }}
          >
            <Ionicons name="close" size={24} color="#F72585" />
            <Text style={[styles.rejectText, { color: "#F72585" }]}>Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              onApply(job);
              onClose();
            }}
          >
            <Ionicons name="heart" size={24} color="#FFF" />
            <Text style={styles.applyText}>Apply Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: spacing[1],
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
  },
  companySection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing[4],
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: typography.fontSize.xl,
    fontWeight: "700",
    marginBottom: 2,
  },
  location: {
    fontSize: typography.fontSize.base,
  },
  jobTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: spacing[4],
    lineHeight: 34,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "600",
  },
  postedAt: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[5],
  },
  section: {
    marginBottom: spacing[5],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing[3],
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  skillTag: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
  },
  skillText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    gap: spacing[3],
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    gap: spacing[2],
  },
  rejectText: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
  },
  applyButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  applyText: {
    color: "#FFF",
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
  },
});
