// tamarini-backend/pages/index.js

import React, { useState, useRef } from "react";
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
      upload: "Ajouter une image",
      placeholder:
        "Écris ce que tu comprends, ta démarche, ou ta réponse finale…",
      send: "Envoyer",
      loading: "TAMARINI réfléchit…",
      attached: "Image jointe :",
      errorGeneric:
        "Désolé, j’ai eu un problème pour réfléchir à ça. Réessaie dans un instant.",
    },
    ar: {
      title: "تَمَارِينِي",
      subtitle: "معلّم رياضيات يساعدك على الفهم، ليس فقط على إعطاء الإجابة.",
      initial:
        "مرحباً، أنا تَمَارِينِي.\n" +
        "التقط صورة واضحة لتمرين الرياضيات، أو اكتب السؤال هنا، ثم أخبرني ماذا فهمت حتى الآن. " +
        "سأرشدك خطوة بخطوة، وفي النهاية نتحقق من إجابتك معاً.",
      upload: "رفع صورة",
      placeholder:
        "اكتب ما تفهمه من التمرين، أو خطواتك، أو الجواب النهائي…",
      send: "إرسال",
      loading: "تَمَارِينِي يفكّر…",
      attached: "صورة مرفقة:",
      errorGeneric:
        "عذراً، حدث خطأ أثناء المعالجة. حاول مرة أخرى بعد قليل.",
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

  const sendMessageToBackend = async (newMessages, imageData) => {
    try {
      setLoading(true);

      const apiMessages = newMessages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const body = { messages: apiMessages, language };

      if (imageData) {
        body.image = {
          base64: imageData.dataUrl, // full data URL, backend strips prefix
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

  const handleSend = () => {
    if (!inputText.trim() && !pendingImage) {
      return;
    }

    const textToSend = inputText.trim()
      ? inputText.trim()
      : pendingImage
      ? language === "ar"
        ? "هذه صورة التمرين."
        : "Voici l’image de mon exercice."
      : "";

    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      imageUrl: pendingImage ? pendingImage.previewUrl : null,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    const imageForThisMessage = pendingImage;
    setPendingImage(null);
    setTimeout(scrollToBottom, 50);

    sendMessageToBackend(newMessages, imageForThisMessage);
  };

  return (
    <div className="chat-card">
      <div className="chat-header">
        <h2 className="chat-title">{t.title}</h2>
        <p className="chat-subtitle">{t.subtitle}</p>
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

        <div className="input-area">
          <div className="input-row">
            <label className="upload-label">
              {t.upload}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </label>

            <textarea
              className="input-textarea"
              placeholder={t.placeholder}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <button
              onClick={handleSend}
              className="send-button"
              disabled={loading}
            >
              {t.send}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
