// tamarini-backend/pages/_app.js

import "../styles/globals.css";
import Link from "next/link";
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
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <SettingsProvider>
      <AppShell>
        <Component {...pageProps} />
      </AppShell>
    </SettingsProvider>
  );
}

export default MyApp;
