import { Appearance } from "react-native";
import { create } from "zustand";
import { colors } from "../constants/colors";
import { storage } from "../utils/storage";

type ThemeMode = "light" | "dark" | "system";
type ActiveTheme = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  activeTheme: ActiveTheme;
  colors: typeof colors.light | typeof colors.dark;

  setMode: (mode: ThemeMode) => Promise<void>;
  initialize: () => Promise<void>;
}

const getSystemTheme = (): ActiveTheme => {
  return Appearance.getColorScheme() || "light";
};

const getColorsForTheme = (theme: ActiveTheme) => {
  return theme === "dark" ? colors.dark : colors.light;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system",
  activeTheme: getSystemTheme(),
  colors: getColorsForTheme(getSystemTheme()),

  initialize: async () => {
    const savedTheme = await storage.getTheme();
    const mode = savedTheme || "system";
    const activeTheme: ActiveTheme =
      mode === "system" ? getSystemTheme() : mode;

    set({
      mode,
      activeTheme,
      colors: getColorsForTheme(activeTheme),
    });

    // Listen for system theme changes
    Appearance.addChangeListener(({ colorScheme }) => {
      const currentMode = useThemeStore.getState().mode;
      if (currentMode === "system") {
        const newTheme: ActiveTheme = colorScheme || "light";
        set({
          activeTheme: newTheme,
          colors: getColorsForTheme(newTheme),
        });
      }
    });
  },

  setMode: async (mode) => {
    await storage.setTheme(mode);
    const activeTheme: ActiveTheme =
      mode === "system" ? getSystemTheme() : mode;

    set({
      mode,
      activeTheme,
      colors: getColorsForTheme(activeTheme),
    });
  },
}));

export default useThemeStore;
