import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mi Landing Web Fácil",
  description: "Creá tu tarjeta digital y compartila con un tag NFC o un código QR.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
