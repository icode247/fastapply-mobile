import { useThemeStore } from "../stores";

export const useTheme = () => {
  const { mode, activeTheme, colors, setMode, initialize } = useThemeStore();

  return {
    mode,
    activeTheme,
    colors,
    isDark: activeTheme === "dark",
    isLight: activeTheme === "light",
    setMode,
    initialize,
  };
};

export default useTheme;
