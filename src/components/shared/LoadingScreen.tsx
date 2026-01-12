import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    marginTop: spacing[4],
    fontSize: typography.fontSize.base,
  },
});

export default LoadingScreen;
