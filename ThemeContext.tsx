import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      try {
        const stored = localStorage.getItem("theme");
        return (stored as Theme) || defaultTheme;
      } catch (error) {
        console.warn("LocalStorage read error:", error);
        return defaultTheme;
      }
    }
    return defaultTheme;
  });

  // ✅ حماية DOM manipulation من removeChild errors
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (!root) return;

      if (theme === "dark") {
        root.classList?.add?.("dark");
      } else {
        root.classList?.remove?.("dark");
      }

      if (switchable) {
        try {
          localStorage.setItem("theme", theme);
        } catch (storageError) {
          console.warn("LocalStorage write error:", storageError);
        }
      }
    } catch (error) {
      console.error("Theme update error:", error);
    }
  }, [theme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
