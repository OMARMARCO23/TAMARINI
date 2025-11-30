// tamarini-backend/pages/index.js

import React, { useRef, useState, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";

export default function Home() {
  const { language } = useSettings();

  const TEXT = {
    fr: {
      title: "TAMARINI",
      subtitle: "Tuteur de maths qui t’aide à comprendre, pas juste à copier.",
      initial:
        "Salut, je suis TAMARINI.\n" +
        "Envoie une photo claire de ton exercice de maths, ou écris-le ici, puis explique-moi ce que tu as compris. " +
        "Je vais te guider étape par étape, et à la fin on vérifiera ta réponse ensemble.",
      upload: "Image",
      placeholder:
        "Écris ce que tu comprends, ta démarche, ou ta réponse finale…",
      send: "Envoyer",
      checkStep: "Vérifier l’étape",
      similarExercise: "Exercice similaire",
      newExercise: "Nouvel exercice",
      loading: "TAMARINI réfléchit…",
      attached: "Image jointe :",
      errorGeneric:
        "Désolé, j’ai eu un problème pour réfléchir à ça. Réessaie dans un instant.",
      defaultImageText: "Voici l’image de mon exercice.",
      defaultSimilarRequest: "Je voudrais un exercice similaire au précédent.",
    },
    ar: {
      title: "تَمَارِينِي",
      subtitle: "معلّم رياضيات يساعدك على الفهم، ليس فقط على إعطاء الإجابة.",
      initial:
        "مرحباً، أنا تَمَارِينِي.\n" +
        "التقط صورة واضحة لتمرين الرياضيات، أو اكتب السؤال هنا، ثم أخبرني ماذا فهمت حتى الآن. " +
        "سأرشدك خطوة بخطوة، وفي النهاية نتحقق من إجابتك معاً.",
      upload: "صورة",
      placeholder:
        "اكتب ما تفهمه من التمرين، أو خطواتك، أو الجواب النهائي…",
      send: "إرسال",
      checkStep: "تحقّق من الخطوة",
      similarExercise: "تمرين مشابه",
      newExercise: "تمرين جديد",
      loading: "تَمَارِينِي يفكّر…",
      attached: "صورة مرفقة:",
      errorGeneric:
        "عذراً، حدث خطأ أثناء المعالجة. حاول مرة أخرى بعد قليل.",
      defaultImageText: "هذه صورة التمرين.",
      defaultSimilarRequest: "أريد تمريناً مشابهاً للتمرين السابق.",
    },
  };

  const t = TEXT[language] || TEXT.fr;

  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "assistant",
      text: t.initial,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [pendingImage, setPendingImage] = useState(null); // { previewUrl, dataUrl, mimeType }
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // When language changes, update the first assistant message
  useEffect(() => {
    setMessages((prev) => {
      const copy = [...prev];
      if (copy.length > 0 && copy[0].sender === "assistant") {
        copy[0] = { ...copy[0], text: t.initial };
      }
      return copy;
    });
  }, [language]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();

    reader.onloadend = () => {
      const dataUrl = reader.result; // "data:image/jpeg;base64,..."
      setPendingImage({
        previewUrl,
        dataUrl,
        mimeType: file.type || "image/jpeg",
      });
    };

    reader.readAsDataURL(file);
  };

  const sendMessageToBackend = async (newMessages, imageData, mode = "normal") => {
    try {
      setLoading(true);

      const apiMessages = newMessages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const body = { messages: apiMessages, language, mode };

      if (imageData) {
        body.image = {
          base64: imageData.dataUrl, // full data URL, backend will strip prefix
          mimeType: imageData.mimeType,
        };
      }

      const res = await fetch("/api/tamarini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const contentType = res.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON response from server:", text);
        throw new Error("Server did not return JSON");
      }

      if (!res.ok || !data.reply) {
        throw new Error(data.error || "No reply from server");
      }

      const botMessage = {
        id: Date.now().toString() + "-bot",
        sender: "assistant",
        text: data.reply,
      };

      setMessages((prev) => [...prev, botMessage]);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Error talking to TAMARINI:", err);
      const errorMessage = {
        id: Date.now().toString() + "-err",
        sender: "assistant",
        text: t.errorGeneric,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setTimeout(scrollToBottom, 50);
    } finally {
      setLoading(false);
    }
  };

  // mode: "normal" | "check-step" | "similar-exercise"
  const handleSend = (mode = "normal") => {
    // For normal / check-step, need some input or image
    if (mode !== "similar-exercise" && !inputText.trim() && !pendingImage) {
      return;
    }

    let textToSend = "";

    if (mode === "similar-exercise") {
      // Ignore current input, send a clear request for similar exercise
      textToSend = t.defaultSimilarRequest;
    } else {
      if (inputText.trim()) {
        textToSend = inputText.trim();
      } else if (pendingImage) {
        textToSend = t.defaultImageText;
      }
    }

    // If still empty (shouldn't happen in normal/check-step), abort
    if (!textToSend) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      imageUrl: pendingImage ? pendingImage.previewUrl : null,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    if (mode !== "similar-exercise") {
      setInputText("");
    } else {
      // For similar-exercise, keep input as is (user might have notes)
      setInputText(inputText);
    }

    const imageForThisMessage = pendingImage;
    setPendingImage(null);
    setTimeout(scrollToBottom, 50);

    sendMessageToBackend(newMessages, imageForThisMessage, mode);
  };

  const handleNewExercise = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: "assistant",
        text: t.initial,
      },
    ]);
    setInputText("");
    setPendingImage(null);
  };

  const isRTL = language === "ar";

  return (
    <>
      <div className="chat-card">
        <div className="chat-header">
          <div className="chat-header-main">
            <h2 className="chat-title">{t.title}</h2>
            <p className="chat-subtitle">{t.subtitle}</p>
          </div>
          <button
            type="button"
            className="chat-header-action"
            onClick={handleNewExercise}
          >
            {t.newExercise}
          </button>
        </div>

        <div className="chat-body">
          <div className="messages-pane">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  "message-row " +
                  (msg.sender === "user" ? "user" : "assistant")
                }
              >
                <div
                  className={
                    "message-bubble " +
                    (msg.sender === "user" ? "user" : "assistant")
                  }
                  style={{
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="exercise"
                      className="message-image"
                    />
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {pendingImage && (
            <div className="preview-bar">
              <span className="preview-label">{t.attached}</span>
              <img
                src={pendingImage.previewUrl}
                alt="preview"
                className="preview-thumb"
              />
            </div>
          )}

          {loading && <div className="loading-bar">{t.loading}</div>}

          {/* Bigger, separate input frame */}
          <div className="input-area">
            <div className="input-label-row">
              <label className="upload-label">
                {t.upload}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <textarea
              className="input-textarea"
              placeholder={t.placeholder}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ direction: isRTL ? "rtl" : "ltr" }}
            />
          </div>
        </div>
      </div>

      {/* Bottom buttons - like a modern mobile app action bar */}
      <div className="footer-actions">
        <div className="footer-actions-inner">
          <button
            type="button"
            className="footer-button footer-button-secondary"
            onClick={() => handleSend("check-step")}
            disabled={loading}
          >
            {t.checkStep}
          </button>
          <button
            type="button"
            className="footer-button footer-button-primary"
            onClick={() => handleSend("normal")}
            disabled={loading}
          >
            {t.send}
          </button>
          <button
            type="button"
            className="footer-button footer-button-secondary"
            onClick={() => handleSend("similar-exercise")}
            disabled={loading}
          >
            {t.similarExercise}
          </button>
        </div>
      </div>
    </>
  );
}
