
"use client";

import { useEffect } from "react";

const STORAGE_KEY = "taskflowPreferences";

// Read the saved theme preference
function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return "light";

    const preferences = JSON.parse(saved);

    return ["light", "dark", "system"].includes(preferences.theme)
      ? preferences.theme
      : "light";
  } catch (error) {
    console.error("Error reading theme preference:", error);
    return "light";
  }
}

// Apply the selected theme globally
function applyTheme(theme) {
  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const shouldUseDark =
    theme === "dark" ||
    (theme === "system" && prefersDark);

  document.documentElement.classList.toggle(
    "dark",
    shouldUseDark
  );

  document.documentElement.style.colorScheme =
    shouldUseDark ? "dark" : "light";
}

export default function ThemeProvider({ children }) {
  useEffect(() => {
    const syncTheme = () => {
      const theme = getSavedTheme();
      applyTheme(theme);
    };

    // Apply theme when the application loads
    syncTheme();

    // Listen for theme changes from Settings
    window.addEventListener(
      "taskflow-theme-change",
      syncTheme
    );

    // Listen for system appearance changes
    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    mediaQuery.addEventListener?.("change", syncTheme);

    // Listen for changes from another browser tab
    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener(
        "taskflow-theme-change",
        syncTheme
      );

      mediaQuery.removeEventListener?.(
        "change",
        syncTheme
      );

      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  return children;
}
