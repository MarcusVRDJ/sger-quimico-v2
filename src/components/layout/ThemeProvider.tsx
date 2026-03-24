"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  mounted: boolean;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "sger-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    const applyTheme = (nextTheme: Theme) => {
      setTheme(nextTheme);
      root.classList.toggle("dark", nextTheme === "dark");
    };

    const initialTheme: Theme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : getSystemTheme();

    applyTheme(initialTheme);
    setMounted(true);

    if (storedTheme === "light" || storedTheme === "dark") {
      return;
    }

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      applyTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mounted,
      toggleTheme: () => {
        setTheme((currentTheme) => {
          const nextTheme: Theme = currentTheme === "dark" ? "light" : "dark";
          localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
          document.documentElement.classList.toggle("dark", nextTheme === "dark");
          return nextTheme;
        });
      },
    }),
    [mounted, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }
  return context;
}
