import type { Metadata, Viewport } from "next"
import "./globals.css"
import "./access.css"

export const metadata: Metadata = {
  title: "Germango 9.6 — Aprende alemán",
  description: "Aprende alemán con lecciones, tarjetas de práctica y un traductor español-alemán para guardar tus frases favoritas.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f8f5",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
