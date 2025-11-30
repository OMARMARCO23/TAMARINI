// tamarini-backend/pages/_app.js

import React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import "../styles/globals.css";
import { SettingsProvider, useSettings } from "../context/SettingsContext";

function AppShell({ children }) {
  const router = useRouter();
  const { language, theme } = useSettings();

  const labels = {
    fr: {
      title: "TAMARINI",
      slogan: "Tuteur de maths qui t’aide à comprendre",
      home: "Accueil",
      settings: "Paramètres",
      about: "À propos",
    },
    ar: {
      title: "تَمَارِينِي",
      slogan: "معلّم رياضيات يساعدك على الفهم",
      home: "الرئيسية",
      settings: "الإعدادات",
      about: "حول",
    },
  };

  const t = labels[language] || labels.fr;

  const isActive = (path) => router.pathname === path;

  return (
    <div className={`app-root theme-${theme}`}>
      <div className="app-shell">
        {/* Header: logo + slogan only */}
        <header className="app-header">
          <div className="header-left">
            <span className="app-logo">{t.title}</span>
            <span className="app-slogan">{t.slogan}</span>
          </div>
        </header>

        <main className="app-main">{children}</main>

        {/* Bottom navigation: Accueil / Paramètres / À propos */}
        <nav className="bottom-nav">
          <Link
            href="/"
            className={
              "bottom-nav-item " +
              (isActive("/") ? "bottom-nav-item--active" : "")
            }
          >
            <span className="bottom-nav-icon">🏠</span>
            <span className="bottom-nav-label">{t.home}</span>
          </Link>

          <Link
            href="/settings"
            className={
              "bottom-nav-item " +
              (isActive("/settings") ? "bottom-nav-item--active" : "")
            }
          >
            <span className="bottom-nav-icon">⚙️</span>
            <span className="bottom-nav-label">{t.settings}</span>
          </Link>

          <Link
            href="/about"
            className={
              "bottom-nav-item " +
              (isActive("/about") ? "bottom-nav-item--active" : "")
            }
          >
            <span className="bottom-nav-icon">ℹ️</span>
            <span className="bottom-nav-label">{t.about}</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <SettingsProvider>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <meta name="theme-color" content="#0f172a" />
        <title>TAMARINI</title>
      </Head>
      <AppShell>
        <Component {...pageProps} />
      </AppShell>
    </SettingsProvider>
  );
}

export default MyApp;
