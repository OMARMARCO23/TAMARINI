// tamarini-mobile/App.js

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

// YOUR backend API:
const API_URL = "https://tamarini.vercel.app/api/tamarini";

/* ---------- Settings context (language + theme) ---------- */

const SettingsContext = createContext(null);

function SettingsProvider({ children }) {
  const [language, setLanguage] = useState("fr"); // "fr" | "ar"
  const [theme, setTheme] = useState("light"); // "light" | "dark"

  // In a real app you can load/save from AsyncStorage

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

function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }
  return ctx;
}

/* ---------- Theme colors ---------- */

const themeColors = {
  light: {
    bg: "#fef3c7",
    headerGradientStart: "#2563eb",
    headerGradientEnd: "#ec4899",
    cardBg: "#ffffff",
    cardBorder: "#e5e7eb",
    userBubble: "#6366f1",
    userText: "#ffffff",
    assistantBubble: "#e0f2fe",
    assistantBubble2: "#ccfbf1",
    text: "#111827",
    subtle: "#6b7280",
    inputBg: "#f9fafb",
  },
  dark: {
    bg: "#020617",
    headerGradientStart: "#0f172a",
    headerGradientEnd: "#f97316",
    cardBg: "#020617",
    cardBorder: "#1f2937",
    userBubble: "#6366f1",
    userText: "#f9fafb",
    assistantBubble: "#0f172a",
    assistantBubble2: "#0b1120",
    text: "#f9fafb",
    subtle: "#9ca3af",
    inputBg: "#020617",
  },
};

/* ---------- Labels for FR / AR ---------- */

const STRINGS = {
  fr: {
    appTitle: "TAMARINI",
    subtitle: "Ton tuteur de maths personnel 🌈",
    initial:
      "Salut, je suis TAMARINI.\n" +
      "Prends une photo claire de ton exercice ou écris-le ici, puis explique-moi ce que tu as compris. " +
      "Je vais te guider étape par étape, et à la fin on vérifiera ta réponse ensemble.",
    uploadImage: "Image",
    typePlaceholder:
      "Écris ce que tu comprends, ta démarche, ou ta réponse finale…",
    send: "Envoyer",
    thinking: "TAMARINI réfléchit…",
    attached: "Image jointe",
    settings: "Paramètres",
    language: "Langue",
    french: "Français",
    arabic: "Arabe",
    theme: "Thème",
    light: "Clair",
    dark: "Sombre",
    close: "Fermer",
  },
  ar: {
    appTitle: "تَمَارِينِي",
    subtitle: "معلّم الرياضيات الخاص بك 🌈",
    initial:
      "مرحباً، أنا تَمَارِينِي.\n" +
      "التقط صورة واضحة لتمرين الرياضيات أو اكتب السؤال هنا، ثم أخبرني ماذا فهمت حتى الآن. " +
      "سأرشدك خطوة بخطوة، وفي النهاية نتحقق من إجابتك معاً.",
    uploadImage: "صورة",
    typePlaceholder:
      "اكتب ما تفهمه من التمرين، أو خطواتك، أو الجواب النهائي…",
    send: "إرسال",
    thinking: "تَمَارِينِي يفكّر…",
    attached: "صورة مرفقة",
    settings: "الإعدادات",
    language: "اللغة",
    french: "الفرنسية",
    arabic: "العربية",
    theme: "المظهر",
    light: "فاتح",
    dark: "داكن",
    close: "إغلاق",
  },
};

/* ---------- Main App ---------- */

function ChatScreen() {
  const { language, theme } = useSettings();
  const colors = themeColors[theme];
  const STR = STRINGS[language] || STRINGS.fr;

  const [messages, setMessages] = useState([
    { id: "1", sender: "assistant", text: STR.initial },
  ]);
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState(null); // { uri, base64, mimeType }
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const scrollViewRef = useRef(null);

  useEffect(() => {
    // If language changes, replace the first assistant message text
    setMessages((prev) => {
      const copy = [...prev];
      if (copy.length > 0 && copy[0].sender === "assistant") {
        copy[0] = { ...copy[0], text: STR.initial };
      }
      return copy;
    });
  }, [language]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const detectMimeTypeFromUri = (uri) => {
    const lower = uri.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".heic")) return "image/heic";
    return "image/jpeg";
  };

  const requestPermissions = async () => {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (cameraPerm.status !== "granted" || libPerm.status !== "granted") {
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const ok = await requestPermissions();
    if (!ok) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setAttachedImage({
        uri: asset.uri,
        base64: asset.base64,
        mimeType: detectMimeTypeFromUri(asset.uri),
      });
    }
  };

  const sendMessageToBackend = async (newMessages, imageForThisMessage) => {
    try {
      setLoading(true);

      const apiMessages = newMessages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const body = { messages: apiMessages, language };

      if (imageForThisMessage && imageForThisMessage.base64) {
        body.image = {
          base64: imageForThisMessage.base64,
          mimeType: imageForThisMessage.mimeType,
        };
      }

      const res = await fetch(API_URL, {
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
        console.log("Non-JSON response:", text);
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
    } catch (e) {
      console.log("Error talking to TAMARINI:", e);
      const failText =
        language === "ar"
          ? "عذراً، حدث خطأ. حاول مرة أخرى بعد قليل."
          : "Désolé, j’ai eu un problème. Réessaie dans un instant.";
      const errorMessage = {
        id: Date.now().toString() + "-err",
        sender: "assistant",
        text: failText,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setTimeout(scrollToBottom, 50);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && !attachedImage) return;

    const textToSend = inputText.trim()
      ? inputText.trim()
      : attachedImage
      ? language === "ar"
        ? "هذه صورة التمرين."
        : "Voici l’image de mon exercice."
      : "";

    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      imageUri: attachedImage ? attachedImage.uri : null,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    const img = attachedImage;
    setAttachedImage(null);
    setTimeout(scrollToBottom, 50);

    sendMessageToBackend(newMessages, img);
  };

  const isRTL = language === "ar";

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { backgroundColor: colors.bg },
        isRTL && { direction: "rtl" },
      ]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View style={styles.headerWrapper}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.headerGradientStart,
              borderBottomColor: "rgba(148,163,184,0.5)",
            },
          ]}
        >
          <View>
            <Text style={styles.appTitle}>{STR.appTitle}</Text>
            <Text style={[styles.subtitle, { color: colors.subtle }]}>
              {STR.subtitle}
            </Text>
          </View>

          <View style={styles.headerIcons}>
            {/* Settings icon */}
            <TouchableOpacity
              onPress={() => setSettingsOpen(true)}
              style={styles.headerIconButton}
            >
              <Text style={{ color: "#fefce8", fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Chat card */}
      <View style={styles.main}>
        <View
          style={[
            styles.chatCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesPane}
            contentContainerStyle={{ paddingVertical: 8 }}
            onContentSizeChange={scrollToBottom}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  msg.sender === "user"
                    ? styles.messageRowUser
                    : styles.messageRowAssistant,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    msg.sender === "user"
                      ? {
                          backgroundColor: colors.userBubble,
                          alignSelf: "flex-end",
                        }
                      : {
                          backgroundColor: colors.assistantBubble,
                          borderColor: colors.assistantBubble2,
                        },
                  ]}
                >
                  {msg.imageUri && (
                    <Image
                      source={{ uri: msg.imageUri }}
                      style={styles.messageImage}
                    />
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      msg.sender === "user"
                        ? { color: colors.userText, textAlign: isRTL ? "right" : "left" }
                        : { color: colors.text, textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Attached image preview */}
          {attachedImage && (
            <View style={styles.previewBar}>
              <Text style={[styles.previewLabel, { color: colors.subtle }]}>
                {STR.attached}
              </Text>
              <Image
                source={{ uri: attachedImage.uri }}
                style={styles.previewThumb}
              />
            </View>
          )}

          {/* Loading */}
          {loading && (
            <View style={styles.loadingBar}>
              <ActivityIndicator
                size="small"
                color={colors.userBubble}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.loadingText, { color: colors.subtle }]}>
                {STR.thinking}
              </Text>
            </View>
          )}

          {/* Input row */}
          <View
            style={[
              styles.inputArea,
              { borderTopColor: colors.cardBorder, backgroundColor: colors.inputBg },
            ]}
          >
            <View style={styles.inputRow}>
              {/* Upload */}
              <TouchableOpacity
                onPress={pickImage}
                style={[
                  styles.uploadButton,
                  { borderColor: colors.userBubble },
                ]}
              >
                <Text style={{ fontSize: 14, color: colors.userBubble }}>
                  📷 {STR.uploadImage}
                </Text>
              </TouchableOpacity>

              {/* Text input */}
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                placeholder={STR.typePlaceholder}
                placeholderTextColor={colors.subtle}
                value={inputText}
                onChangeText={setInputText}
                multiline
              />

              {/* Send button */}
              <TouchableOpacity
                onPress={handleSend}
                style={[styles.sendButton, { backgroundColor: colors.userBubble }]}
                disabled={loading}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                  {STR.send}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </SafeAreaView>
  );
}

/* ---------- Settings bottom sheet ---------- */

function SettingsSheet({ onClose }) {
  const { language, theme, setLanguage, setTheme } = useSettings();
  const colors = themeColors[theme];
  const STR = STRINGS[language] || STRINGS.fr;

  return (
    <View style={styles.sheetOverlay}>
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            {STR.settings}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: colors.userBubble, fontWeight: "600" }}>
              {STR.close}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.sheetLabel, { color: colors.text }]}>
            {STR.language}
          </Text>
          <View style={styles.pillRow}>
            <TouchableOpacity
              style={[
                styles.pillButton,
                language === "fr" && {
                  backgroundColor: "#fce7f3",
                  borderColor: "#ec4899",
                },
              ]}
              onPress={() => setLanguage("fr")}
            >
              <Text style={{ color: colors.text }}>{STR.french}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pillButton,
                language === "ar" && {
                  backgroundColor: "#fef3c7",
                  borderColor: "#f97316",
                },
              ]}
              onPress={() => setLanguage("ar")}
            >
              <Text style={{ color: colors.text }}>{STR.arabic}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sheetSection}>
          <Text style={[styles.sheetLabel, { color: colors.text }]}>
            {STR.theme}
          </Text>
          <View style={styles.pillRow}>
            <TouchableOpacity
              style={[
                styles.pillButton,
                theme === "light" && {
                  backgroundColor: "#dbeafe",
                  borderColor: "#2563eb",
                },
              ]}
              onPress={() => setTheme("light")}
            >
              <Text style={{ color: colors.text }}>{STR.light}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pillButton,
                theme === "dark" && {
                  backgroundColor: "#111827",
                  borderColor: "#4b5563",
                },
              ]}
              onPress={() => setTheme("dark")}
            >
              <Text style={{ color: colors.text }}>{STR.dark}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  header: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fefce8",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    color: "#e5e7eb",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.35)",
    marginLeft: 4,
  },
  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  chatCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  messagesPane: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  messageRow: {
    marginBottom: 6,
    flexDirection: "row",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAssistant: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
  },
  messageImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginBottom: 4,
  },
  previewBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  previewThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginLeft: 8,
  },
  previewLabel: {
    fontSize: 12,
  },
  loadingBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  loadingText: {
    fontSize: 12,
  },
  inputArea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  uploadButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#eff6ff",
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 90,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
  },
  sendButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  /* Settings sheet */
  sheetOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  sheetSection: {
    marginTop: 8,
  },
  sheetLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pillButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});

/* ---------- Root component ---------- */

export default function App() {
  return (
    <SettingsProvider>
      <ChatScreen />
    </SettingsProvider>
  );
}
