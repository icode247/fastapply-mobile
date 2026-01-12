// Color Palette - FastApply Theme (matching fastapply.co)
export const colors = {
  light: {
    // Primary brand colors (FastApply Blue)
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

    // Status colors
    success: "#1F7A1F",
    successLight: "#2E7D32",
    successDark: "#0A470A",

    warning: "#9A5B13",
    warningLight: "#AB6E19",
    warningDark: "#72430D",

    error: "#C41C1C",
    errorLight: "#D32F2F",
    errorDark: "#8C0F0F",

    info: "#0B6BCB",
    infoLight: "#185EA5",
    infoDark: "#12467B",

    // Background colors (FastApply Light Mode)
    background: "#FFFFFF",
    backgroundSecondary: "#FBFCFE",
    surface: "#FBFCFE",
    surfaceSecondary: "#F0F4F8",
    level1: "#F0F4F8",
    level2: "#DDE7EE",
    level3: "#CDD7E1",

    // Text colors (FastApply Light Mode)
    text: "#171A1C",
    textSecondary: "#32383E",
    textTertiary: "#555E68",
    textInverse: "#FFFFFF",

    // Border colors
    border: "#CDD7E1",
    borderLight: "#DDE7EE",
    borderDark: "#9FA6AD",

    // Application status colors
    statusApplied: "#0B6BCB",
    statusProcessing: "#9A5B13",
    statusCompleted: "#1F7A1F",
    statusFailed: "#C41C1C",

    // Misc
    overlay: "rgba(0, 0, 0, 0.5)",
    shadow: "rgba(0, 0, 0, 0.1)",
  },
  dark: {
    // Primary brand colors (FastApply Blue - brighter in dark mode)
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

    // Status colors
    success: "#51BC51",
    successLight: "#77DD77",
    successDark: "#1F7A1F",

    warning: "#F5C462",
    warningLight: "#FFDA85",
    warningDark: "#9A5B13",

    error: "#F09898",
    errorLight: "#FFCDD2",
    errorDark: "#C41C1C",

    info: "#4393E4",
    infoLight: "#97C3F0",
    infoDark: "#0B6BCB",

    // Background colors (FastApply Dark Mode - Pure Black Body)
    background: "#000000",
    backgroundSecondary: "#0B0D0E",
    surface: "#0B0D0E",
    surfaceSecondary: "#171A1C",
    level1: "#171A1C",
    level2: "#32383E",
    level3: "#555E68",

    // Text colors (FastApply Dark Mode)
    text: "#F0F4F8",
    textSecondary: "#CDD7E1",
    textTertiary: "#9FA6AD",
    textInverse: "#171A1C",

    // Border colors
    border: "#32383E",
    borderLight: "#555E68",
    borderDark: "#171A1C",

    // Application status colors
    statusApplied: "#4393E4",
    statusProcessing: "#F5C462",
    statusCompleted: "#51BC51",
    statusFailed: "#F09898",

    // Misc
    overlay: "rgba(0, 0, 0, 0.7)",
    shadow: "rgba(0, 0, 0, 0.3)",
  },
} as const;

export type ColorScheme = typeof colors.light;
export type ThemeMode = "light" | "dark";
