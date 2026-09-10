import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mi Landing Web Fácil",
  description: "Creá tu tarjeta digital y compartila con un tag NFC o un código QR.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
