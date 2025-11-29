// tamarini-backend/pages/about.js

import React from "react";
import { useSettings } from "../context/SettingsContext";

export default function AboutPage() {
  const { language } = useSettings();

  const TEXT = {
    fr: {
      title: "À propos de TAMARINI",
      whatTitle: "Qu’est‑ce que TAMARINI ?",
      whatBody:
        "TAMARINI est un tuteur de maths intelligent pour les élèves de 12 à 18 ans. " +
        "Il t’aide à comprendre les exercices étape par étape, au lieu de donner directement la réponse.",
      howTitle: "Comment bien l’utiliser ?",
      howList: [
        "Prends une photo claire de l’exercice ou recopie-le proprement.",
        "Explique toujours ce que tu as compris ou ce que tu as déjà essayé.",
        "Réponds aux questions de TAMARINI, même si tu n’es pas sûr.",
        "À la fin, propose ta réponse avant de demander la solution complète.",
      ],
      noteTitle: "Important",
      noteBody:
        "TAMARINI est là pour t’aider à apprendre, pas pour tricher pendant les contrôles ou examens.",
    },
    ar: {
      title: "حول تَمَارِينِي",
      whatTitle: "ما هو تَمَارِينِي؟",
      whatBody:
        "تَمَارِينِي هو معلّم رياضيات ذكي للتلاميذ من 12 إلى 18 سنة. " +
        "يساعدك على فهم التمارين خطوة بخطوة بدلاً من إعطاء الجواب مباشرة.",
      howTitle: "كيف أستفيد منه بشكل جيد؟",
      howList: [
        "التقط صورة واضحة للتمرين أو أعد كتابته بشكل مرتب.",
        "اشرح دائماً ما الذي فهمته أو ما الذي جرّبته من خطوات.",
        "أجب عن أسئلة تَمَارِينِي حتى لو لم تكن متأكداً تماماً.",
        "في النهاية، اكتب جوابك أنت قبل أن تطلب الحل الكامل.",
      ],
      noteTitle: "مهم",
      noteBody:
        "تَمَارِينِي موجود لمساعدتك على التعلّم، وليس للغش في الفروض أو الامتحانات.",
    },
  };

  const t = TEXT[language] || TEXT.fr;

  return (
    <div className="page-narrow">
      <div className="card">
        <h1>{t.title}</h1>

        <section style={{ marginTop: "0.75rem" }}>
          <h2 style={{ fontSize: "1rem" }}>{t.whatTitle}</h2>
          <p style={{ fontSize: "0.95rem" }}>{t.whatBody}</p>
        </section>

        <section style={{ marginTop: "0.75rem" }}>
          <h2 style={{ fontSize: "1rem" }}>{t.howTitle}</h2>
          <ul style={{ fontSize: "0.95rem", paddingLeft: "1.2rem" }}>
            {t.howList.map((item, i) => (
              <li key={i} style={{ marginBottom: "0.25rem" }}>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginTop: "0.75rem" }}>
          <h2 style={{ fontSize: "1rem" }}>{t.noteTitle}</h2>
          <p style={{ fontSize: "0.95rem" }}>{t.noteBody}</p>
        </section>
      </div>
    </div>
  );
}
