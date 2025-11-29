// tamarini-backend/pages/settings.js

import React from "react";
import { useSettings } from "../context/SettingsContext";

export default function SettingsPage() {
  const { language, theme, setLanguage, setTheme } = useSettings();

  const TEXT = {
    fr: {
      title: "Paramètres",
      intro:
        "Personnalise TAMARINI pour qu’il corresponde à ta langue et à ton style.",
      languageLabel: "Langue de l’application et des explications",
      themeLabel: "Apparence",
      french: "Français",
      arabic: "Arabe",
      light: "Thème clair",
      dark: "Thème sombre",
      note:
        "La langue choisie sera utilisée pour l’interface et pour les explications de TAMARINI.",
    },
    ar: {
      title: "الإعدادات",
      intro:
        "قم بتخصيص تَمَارِينِي باللغة والمظهر اللذين يناسبانك.",
      languageLabel: "لغة التطبيق وشرح التمارين",
      themeLabel: "المظهر",
      french: "الفرنسية",
      arabic: "العربية",
      light: "الوضع الفاتح",
      dark: "الوضع الداكن",
      note:
        "سيتم استخدام اللغة المختارة في الواجهة وفي شرح التمارين من طرف تَمَارِينِي.",
    },
  };

  const t = TEXT[language] || TEXT.fr;

  return (
    <div className="page-narrow">
      <div className="card">
        <h1>{t.title}</h1>
        <p style={{ fontSize: "0.95rem", marginTop: "0.25rem" }}>{t.intro}</p>

        <div className="settings-grid">
          <section>
            <div className="settings-section-title">{t.languageLabel}</div>
            <div className="pill-row">
              <button
                type="button"
                className={
                  "pill-button " + (language === "fr" ? "active" : "")
                }
                onClick={() => setLanguage("fr")}
              >
                {t.french}
              </button>
              <button
                type="button"
                className={
                  "pill-button " + (language === "ar" ? "active" : "")
                }
                onClick={() => setLanguage("ar")}
              >
                {t.arabic}
              </button>
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--color-subtle)",
                marginTop: "0.4rem",
              }}
            >
              {t.note}
            </p>
          </section>

          <section>
            <div className="settings-section-title">{t.themeLabel}</div>
            <div className="pill-row">
              <button
                type="button"
                className={
                  "pill-button " + (theme === "light" ? "active" : "")
                }
                onClick={() => setTheme("light")}
              >
                {t.light}
              </button>
              <button
                type="button"
                className={
                  "pill-button " + (theme === "dark" ? "active" : "")
                }
                onClick={() => setTheme("dark")}
              >
                {t.dark}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
