import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sirley-gomez-spa.greencomet16384.chatgpt.site"),
  title: "Sirley Gómez | Silhouette & Harmony · Sterling, VA",
  description: "Maderoterapia, masajes reductores y rituales faciales en Sterling, Virginia. Body care, wood therapy and gift cards. By appointment / Con cita previa.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
