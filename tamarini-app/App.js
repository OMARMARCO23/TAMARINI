// tamarini-backend/app/page.js
"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "assistant",
      text:
        "Hi, I am TAMARINI.\n" +
        "Upload a clear photo of your math exercise, or type it here, and tell me what you understand so far. " +
        "I will guide you step by step, and at the end we will check your final answer together.",
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
      const dataUrl = reader.result; // "data:image/jpeg;base64,...."
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

      const body = { messages: apiMessages };

      if (imageData) {
        body.image = {
          base64: imageData.dataUrl, // full data URL, backend strips prefix
          mimeType: imageData.mimeType,
        };
      }

      // Because this code runs in the browser on the same domain,
      // we can call the API route with a relative URL:
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
        text:
          "Sorry, I had a problem thinking about this. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      setTimeout(scrollToBottom, 50);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && !pendingImage) {
      return; // nothing to send
    }

    const textToSend = inputText.trim()
      ? inputText.trim()
      : pendingImage
      ? "Here is my exercise image."
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

    // Call backend with this new state
    sendMessageToBackend(newMessages, imageForThisMessage);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f2f2f7",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <header
        style={{
          padding: "0.75rem 1rem",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #ddd",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>TAMARINI</h1>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
          Math tutor that guides you, not just gives answers
        </p>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "0.5rem",
          maxWidth: "800px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0.5rem",
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent:
                  msg.sender === "user" ? "flex-end" : "flex-start",
                marginBottom: "0.5rem",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  borderRadius: "12px",
                  padding: "0.5rem 0.75rem",
                  backgroundColor:
                    msg.sender === "user" ? "#007AFF" : "#e5e5ea",
                  color: msg.sender === "user" ? "#fff" : "#111",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.imageUrl && (
                  <div style={{ marginBottom: "0.25rem" }}>
                    <img
                      src={msg.imageUrl}
                      alt="exercise"
                      style={{
                        maxWidth: "100%",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {pendingImage && (
          <div
            style={{
              backgroundColor: "#fff",
              borderTop: "1px solid #ddd",
              padding: "0.5rem 1rem",
            }}
          >
            <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.8rem" }}>
              Attached image:
            </p>
            <img
              src={pendingImage.previewUrl}
              alt="preview"
              style={{
                maxWidth: "150px",
                borderRadius: "8px",
                display: "block",
              }}
            />
          </div>
        )}

        {loading && (
          <div
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.9rem",
              color: "#555",
            }}
          >
            TAMARINI is thinking...
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            padding: "0.5rem",
            backgroundColor: "#ffffff",
            borderTop: "1px solid #ddd",
          }}
        >
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.4rem 0.7rem",
              borderRadius: "999px",
              backgroundColor: "#eee",
              fontSize: "0.8rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Upload image
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </label>

          <textarea
            style={{
              flex: 1,
              minHeight: "2.2rem",
              maxHeight: "6rem",
              padding: "0.4rem 0.6rem",
              borderRadius: "999px",
              border: "1px solid #ccc",
              resize: "none",
              fontFamily: "inherit",
              fontSize: "0.9rem",
            }}
            placeholder="Type what you understand, your step, or your final answer..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <button
            onClick={handleSend}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: "999px",
              border: "none",
              backgroundColor: "#007AFF",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
            disabled={loading}
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
}
