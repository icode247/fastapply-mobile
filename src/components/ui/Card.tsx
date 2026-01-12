import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {
  borderRadius,
  shadows,
  spacing,
  typography,
} from "../../constants/theme";
import { useTheme } from "../../hooks";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  variant?: "elevated" | "outlined" | "filled";
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  onPress,
  style,
  headerStyle,
  contentStyle,
  variant = "elevated",
}) => {
  const { colors } = useTheme();

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "outlined":
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case "filled":
        return {
          backgroundColor: colors.surfaceSecondary,
        };
      case "elevated":
      default:
        return {
          backgroundColor: colors.surface,
          ...shadows.md,
        };
    }
  };

  const content = (
    <View style={[styles.card, getVariantStyle(), style]}>
      {(title || subtitle) && (
        <View style={[styles.header, headerStyle]}>
          {title && (
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  content: {
    padding: spacing[4],
  },
});

export default Card;
