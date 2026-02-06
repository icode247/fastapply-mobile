import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Text } from "../ui/Text";
import { borderRadius, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { ApplicationStatus } from "../../types";

interface StatusBadgeProps {
  status: ApplicationStatus | string;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  style,
}) => {
  const { colors } = useTheme();

  const getStatusColor = () => {
    const statusColors: Record<string, { bg: string; text: string }> = {
      pending: { bg: colors.info + "20", text: colors.info },
      processing: { bg: colors.warning + "20", text: colors.warning },
      applied: { bg: colors.statusApplied + "20", text: colors.statusApplied },
      submitted: {
        bg: colors.statusApplied + "20",
        text: colors.statusApplied,
      },
      completed: { bg: colors.success + "20", text: colors.success },
      failed: { bg: colors.error + "20", text: colors.error },
      skipped: { bg: colors.textTertiary + "20", text: colors.textTertiary },
      cancelled: { bg: colors.textTertiary + "20", text: colors.textTertiary },
    };

    return (
      statusColors[status] || { bg: colors.border, text: colors.textSecondary }
    );
  };

  const getSizeStyle = () => {
    const sizes = {
      sm: { paddingVertical: 2, paddingHorizontal: 6, fontSize: typography.fontSize.xs },
      md: { paddingVertical: 4, paddingHorizontal: 10, fontSize: typography.fontSize.xs },
      lg: { paddingVertical: 6, paddingHorizontal: 14, fontSize: typography.fontSize.sm },
    };
    return sizes[size];
  };

  const { bg, text } = getStatusColor();
  const sizeStyle = getSizeStyle();

  const formatStatus = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
        style,
      ]}
    >
      <Text
        style={[styles.text, { color: text, fontSize: sizeStyle.fontSize }]}
      >
        {formatStatus(status)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: "600",
  },
});

export default StatusBadge;
