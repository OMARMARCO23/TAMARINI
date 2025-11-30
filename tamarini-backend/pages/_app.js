// tamarini-backend/pages/_app.js

import React from "react";
import Head from "next/head";
import Link from "next/link";
import "../styles/globals.css";
import { SettingsProvider, useSettings } from "../context/SettingsContext";

function AppShell({ children }) {
  const { language, theme } = useSettings();

  const labels = {
    fr: {
      title: "TAMARINI",
      home: "Accueil",
      settings: "Paramètres",
      about: "À propos",
    },
    ar: {
      title: "تَمَارِينِي",
      home: "الرئيسية",
      settings: "الإعدادات",
      about: "حول",
    },
  };

  const t = labels[language] || labels.fr;

  return (
    <div className={`app-root theme-${theme}`}>
      {/* This inner shell is sized like a phone (max-width ~ 430px) */}
      <div className="app-shell">
        <header className="app-header">
          <Link href="/" className="app-logo">
            {t.title}
          </Link>
          <nav className="app-nav">
            <Link href="/">{t.home}</Link>
            <Link href="/settings">{t.settings}</Link>
            <Link href="/about">{t.about}</Link>
          </nav>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <SettingsProvider>
      <Head>
        {/* Mobile viewport so it behaves like a real mobile app */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta name="theme-color" content="#2563eb" />
        <title>TAMARINI</title>
      </Head>
      <AppShell>
        <Component {...pageProps} />
      </AppShell>
    </SettingsProvider>
  );
}

export default MyApp;
