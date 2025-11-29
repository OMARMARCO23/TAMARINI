// tamarini-backend/pages/index.js

export default function Home() {
  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "2rem",
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      <h1>TAMARINI Backend</h1>
      <p>
        This is the API server for the <strong>TAMARINI</strong> math tutor mobile
        app.
      </p>

      <h2>API Endpoint</h2>
      <p>
        POST requests to:
        <br />
        <code>/api/tamarini</code>
      </p>

      <h3>Request Body (JSON)</h3>
      <pre
        style={{
          background: "#f5f5f5",
          padding: "1rem",
          borderRadius: "4px",
          overflowX: "auto",
        }}
      >
        {`{
  "messages": [
    { "sender": "user", "text": "Here is my exercise" },
    { "sender": "assistant", "text": "Some previous reply from TAMARINI" }
  ],
  "image": {
    "base64": "....",      // optional, base64-encoded image
    "mimeType": "image/jpeg"
  }
}`}
      </pre>

      <h3>Response (JSON)</h3>
      <pre
        style={{
          background: "#f5f5f5",
          padding: "1rem",
          borderRadius: "4px",
          overflowX: "auto",
        }}
      >
        {`{
  "reply": "TAMARINI's next message to the student..."
}`}
      </pre>

      <p style={{ marginTop: "2rem", fontSize: "0.9rem", color: "#666" }}>
        The Google Gemini API key is stored securely as a Vercel environment
        variable and is never exposed to the client or mobile app.
      </p>
    </div>
  );
}
