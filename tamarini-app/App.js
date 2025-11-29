// tamarini-app/App.js

import React, { useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

// Replace this with your real Vercel backend URL AFTER deployment
// For local testing with a tunnel, you can temporarily use a local URL.
const API_URL = "https://YOUR-VERCEL-PROJECT.vercel.app/api/tamarini";

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "assistant",
      text:
        "Hi, I am TAMARINI.\n" +
        "Take a clear photo or upload your math exercise, and tell me what you understand so far. " +
        "I will guide you step by step, and at the end we will check your final answer together.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState(null); // { uri, base64, mimeType }
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef(null);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const detectMimeTypeFromUri = (uri) => {
    const lower = uri.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".heic")) return "image/heic";
    return "image/jpeg"; // default
  };

  const requestPermissions = async () => {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (cameraPerm.status !== "granted" || libPerm.status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow camera and gallery access to send exercises."
      );
      return false;
    }
    return true;
  };

  const openCamera = async () => {
    const ok = await requestPermissions();
    if (!ok) return;

    const result = await ImagePicker.launchCameraAsync({
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

  const openGallery = async () => {
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

  const onPressAddImage = () => {
    Alert.alert("Add exercise image", "Choose source", [
      { text: "Camera", onPress: openCamera },
      { text: "Gallery", onPress: openGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const sendMessageToBackend = async (newMessages, imageForThisMessage) => {
    try {
      setLoading(true);

      // Prepare messages for API (we only send text + sender, not image URIs)
      const apiMessages = newMessages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const body = {
        messages: apiMessages,
      };

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

      const data = await res.json();

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
    if (!inputText.trim() && !attachedImage) {
      return; // nothing to send
    }

    const textToSend = inputText.trim()
      ? inputText.trim()
      : attachedImage
      ? "Here is my exercise image."
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
    const imageForThisMessage = attachedImage;
    setAttachedImage(null);
    setTimeout(scrollToBottom, 50);

    // Call backend with this new state
    sendMessageToBackend(newMessages, imageForThisMessage);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TAMARINI</Text>
        <Text style={styles.headerSubtitle}>
          Math tutor that guides you, not just gives answers
        </Text>
      </View>

      <ScrollView
        style={styles.messagesContainer}
        ref={scrollViewRef}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender === "user" ? styles.userBubble : styles.botBubble,
            ]}
          >
            {msg.imageUri && (
              <Image source={{ uri: msg.imageUri }} style={styles.messageImage} />
            )}
            <Text style={msg.sender === "user" ? styles.userText : styles.botText}>
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      {attachedImage && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Attached image:</Text>
          <Image source={{ uri: attachedImage.uri }} style={styles.previewImage} />
        </View>
      )}

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#555" />
          <Text style={styles.loadingText}>TAMARINI is thinking...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TouchableOpacity onPress={onPressAddImage} style={styles.iconButton}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>CAM</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Type what you understand, your step, or your final answer..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />

        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={{ color: "white", fontWeight: "bold" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f7" },
  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333" },
  headerSubtitle: { fontSize: 12, color: "#666", marginTop: 2 },
  messagesContainer: { flex: 1, paddingHorizontal: 10, paddingTop: 8 },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 12,
    padding: 8,
    marginVertical: 4,
  },
  userBubble: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  botBubble: {
    backgroundColor: "#e5e5ea",
    alignSelf: "flex-start",
  },
  userText: { color: "white" },
  botText: { color: "#111" },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  previewContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
  },
  previewLabel: { fontSize: 12, color: "#555", marginBottom: 4 },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  loadingText: { marginLeft: 8, color: "#555" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
  },
  iconButton: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    marginHorizontal: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
