import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ds-theme-mode"; // 'system' | 'light' | 'dark'

export const dsTokens = {
  light: {
    bg: {
      primary: "#FFFFFF",
      secondary: "#F3F4F6",
      tertiary: "#F8FAFC",
    },
    surface: {
      primary: "#FFFFFF",
      elevated: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#475569",
      tertiary: "#64748B",
      inverse: "#FFFFFF",
    },
    border: {
      default: "#E5E7EB",
      subtle: "#EEF2F7",
    },
    brand: {
      primary: "#2563EB",
      hover: "#1D4ED8",
      active: "#1E40AF",
    },
    state: {
      danger: "#B91C1C",
      dangerBorder: "#FCA5A5",
    },
    glass: {
      tint: "light",
      intensity: 30,
    },
  },
  dark: {
    bg: {
      primary: "#121212",
      secondary: "#0F172A",
      tertiary: "#111827",
    },
    surface: {
      primary: "#1E1E1E",
      elevated: "#1E293B",
    },
    text: {
      primary: "#F1F5F9",
      secondary: "#CBD5E1",
      tertiary: "#94A3B8",
      inverse: "#0F172A",
    },
    border: {
      default: "#334155",
      subtle: "#223047",
    },
    brand: {
      primary: "#3B82F6",
      hover: "#2563EB",
      active: "#1D4ED8",
    },
    state: {
      danger: "#F87171",
      dangerBorder: "rgba(248, 113, 113, 0.55)",
    },
    glass: {
      tint: "dark",
      intensity: 35,
    },
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState("system");

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (!alive) return;
        if (v === "light" || v === "dark" || v === "system") {
          setMode(v);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const theme = useMemo(() => {
    if (mode === "light") return "light";
    if (mode === "dark") return "dark";
    return systemScheme === "dark" ? "dark" : "light";
  }, [mode, systemScheme]);

  const tokens = theme === "dark" ? dsTokens.dark : dsTokens.light;

  const setThemeMode = useCallback(async (nextMode) => {
    setMode(nextMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeMode(next);
  }, [theme, setThemeMode]);

  const value = useMemo(
    () => ({ theme, mode, setMode: setThemeMode, toggleTheme, tokens }),
    [theme, mode, setThemeMode, toggleTheme, tokens],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    const fallback = dsTokens.light;
    return {
      theme: "light",
      mode: "system",
      setMode: async () => {},
      toggleTheme: () => {},
      tokens: fallback,
    };
  }
  return ctx;
}
