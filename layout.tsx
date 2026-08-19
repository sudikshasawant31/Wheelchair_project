import type React from "react"
import type { Metadata } from "next"
import { Manrope, Inter, IBM_Plex_Mono } from "next/font/google"
import { TelemetryProvider } from "@/contexts/telemetry-context"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-mono",
})

export const metadata: Metadata = {
  title: "Aegis Mobility — Assistive BCI Platform",
  description: "AI-powered brain-controlled mobility platform for clinical, rehabilitation, and home use",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} ${plexMono.variable} antialiased dark`}
    >
      <body className="font-sans">
        <TelemetryProvider>{children}</TelemetryProvider>
      </body>
    </html>
  )
}
