import React from "react";
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
} from "react-native";
import { typography } from "../../constants/theme";

type FontWeight = "light" | "regular" | "medium" | "semibold" | "bold";

const WEIGHT_MAP: Record<string, FontWeight> = {
  "300": "light",
  "400": "regular",
  normal: "regular",
  "500": "medium",
  "600": "semibold",
  "700": "bold",
  bold: "bold",
};

interface TextProps extends RNTextProps {
  weight?: FontWeight;
}

export const Text: React.FC<TextProps> = ({ style, weight, ...props }) => {
  const flat = StyleSheet.flatten(style) || {};
  const { fontWeight, fontFamily, ...rest } = flat as any;

  // Determine the weight: explicit prop > style fontWeight > default regular
  let resolvedWeight: FontWeight = "regular";
  if (weight) {
    resolvedWeight = weight;
  } else if (fontWeight && WEIGHT_MAP[fontWeight]) {
    resolvedWeight = WEIGHT_MAP[fontWeight];
  }

  // Only apply Space Grotesk if no custom fontFamily is set
  const resolvedFamily =
    fontFamily && !fontFamily.startsWith("System")
      ? fontFamily
      : typography.fontFamily[resolvedWeight];

  return <RNText {...props} style={[rest, { fontFamily: resolvedFamily }]} />;
};

export default Text;
