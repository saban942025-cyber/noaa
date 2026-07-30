"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const GlobalThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [isHydrated, setIsHydrated] = useState(false);

  // Initial Hydration
  useEffect(() => {
    const savedTheme = localStorage.getItem("saban-theme") as ThemeMode | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const root = window.document.documentElement;
    localStorage.setItem("saban-theme", theme);

    const applyTheme = (isDark: boolean) => {
      root.classList.remove("light", "dark");
      root.classList.add(isDark ? "dark" : "light");
      setResolvedTheme(isDark ? "dark" : "light");
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    } else {
      applyTheme(theme === "dark");
    }
  }, [theme, isHydrated]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      <div 
        className={`min-h-screen transition-colors duration-500 ${!isHydrated ? 'opacity-0' : 'opacity-100'} ${resolvedTheme === 'dark' ? 'bg-saban-black text-white' : 'bg-slate-50 text-slate-900'}`}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useGlobalTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useGlobalTheme must be used within GlobalThemeProvider");
  return context;
};
