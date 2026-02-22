// Color Palette - Scout Theme
export const colors = {
  light: {
    // Primary brand colors
    primary: "#0B6BCB",
    primaryLight: "#185EA5",
    primaryDark: "#12467B",
    primary50: "#E3EFFB",
    primary100: "#C7DFF7",
    primary200: "#97C3F0",
    primary300: "#4393E4",
    primary400: "#0B6BCB",
    primary500: "#185EA5",
    primary600: "#12467B",
    primary700: "#0A2744",
    primary800: "#051423",
    primary900: "#021117",

    // Secondary colors (Neutral)
    secondary: "#636B74",
    secondaryLight: "#9FA6AD",
    secondaryDark: "#32383E",

    // Semantic colors
    success: "#10B981",
    successLight: "#D1FAE5",
    successDark: "#059669",

    warning: "#F59E0B",
    warningLight: "#FEF3C7",
    warningDark: "#D97706",

    error: "#EF4444",
    errorLight: "#FEE2E2",
    errorDark: "#DC2626",

    info: "#3B82F6",
    infoLight: "#DBEAFE",
    infoDark: "#2563EB",

    // Background colors
    background: "#FFFFFF",
    backgroundSecondary: "#FBFCFE",
    surface: "#FBFCFE",
    surfaceSecondary: "#F0F4F8",
    level1: "#F0F4F8",
    level2: "#DDE7EE",
    level3: "#CDD7E1",

    // Text colors
    text: "#171A1C",
    textSecondary: "#32383E",
    textTertiary: "#555E68",
    textInverse: "#FFFFFF",

    // Border colors
    border: "#CDD7E1",
    borderLight: "#DDE7EE",
    borderDark: "#9FA6AD",

    // Application status colors (vivid, badge-ready)
    statusApplied: "#3B82F6",
    statusPending: "#F59E0B",
    statusProcessing: "#8B5CF6",
    statusCompleted: "#10B981",
    statusFailed: "#EF4444",
    statusSkipped: "#6B7280",

    // Misc
    overlay: "rgba(0, 0, 0, 0.5)",
    shadow: "rgba(0, 0, 0, 0.1)",
  },
  dark: {
    // Primary brand colors (brighter in dark mode)
    primary: "#0B6BCB",
    primaryLight: "#4393E4",
    primaryDark: "#185EA5",
    primary50: "#021117",
    primary100: "#051423",
    primary200: "#0A2744",
    primary300: "#12467B",
    primary400: "#185EA5",
    primary500: "#0B6BCB",
    primary600: "#4393E4",
    primary700: "#97C3F0",
    primary800: "#C7DFF7",
    primary900: "#E3EFFB",

    // Secondary colors (Neutral)
    secondary: "#9FA6AD",
    secondaryLight: "#CDD7E1",
    secondaryDark: "#636B74",

    // Semantic colors (brighter for dark mode contrast)
    success: "#34D399",
    successLight: "#064E3B",
    successDark: "#10B981",

    warning: "#FBBF24",
    warningLight: "#78350F",
    warningDark: "#F59E0B",

    error: "#F87171",
    errorLight: "#7F1D1D",
    errorDark: "#EF4444",

    info: "#60A5FA",
    infoLight: "#1E3A5F",
    infoDark: "#3B82F6",

    // Background colors (Pure Black Body)
    background: "#000000",
    backgroundSecondary: "#0B0D0E",
    surface: "#0B0D0E",
    surfaceSecondary: "#171A1C",
    level1: "#171A1C",
    level2: "#32383E",
    level3: "#555E68",

    // Text colors
    text: "#F0F4F8",
    textSecondary: "#CDD7E1",
    textTertiary: "#9FA6AD",
    textInverse: "#171A1C",

    // Border colors
    border: "#32383E",
    borderLight: "#555E68",
    borderDark: "#171A1C",

    // Application status colors (brighter for dark mode)
    statusApplied: "#60A5FA",
    statusPending: "#FBBF24",
    statusProcessing: "#A78BFA",
    statusCompleted: "#34D399",
    statusFailed: "#F87171",
    statusSkipped: "#9CA3AF",

    // Misc
    overlay: "rgba(0, 0, 0, 0.7)",
    shadow: "rgba(0, 0, 0, 0.3)",
  },
} as const;

export type ColorScheme = typeof colors.light;
export type ThemeMode = "light" | "dark";
