// tamarini-backend/app/layout.js

export const metadata = {
  title: "TAMARINI Backend",
  description: "API backend for the TAMARINI math tutor app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
