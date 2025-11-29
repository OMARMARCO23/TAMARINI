// tamarini-backend/context/SettingsContext.js

import React, { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [language, setLanguage] = useState("fr");   // "fr" | "ar"
  const [theme, setTheme] = useState("light");      // "light" | "dark"

  // Load saved settings from localStorage on first client render
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedLang = localStorage.getItem("tamarini_language");
    const storedTheme = localStorage.getItem("tamarini_theme");

    if (storedLang === "fr" || storedLang === "ar") {
      setLanguage(storedLang);
    }
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    }
  }, []);

  // Whenever settings change, persist them and update <html> attributes
  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem("tamarini_language", language);
    localStorage.setItem("tamarini_theme", theme);

    const root = document.documentElement;
    root.dataset.theme = theme;                      // used in CSS: html[data-theme="dark"]
    root.lang = language === "ar" ? "ar" : "fr";
    root.dir = language === "ar" ? "rtl" : "ltr";   // RTL for Arabic
  }, [language, theme]);

  const value = {
    language,
    theme,
    setLanguage,
    setTheme,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }
  return ctx;
}
