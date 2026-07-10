import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "SnapSell AI — Sell faster with AI", template: "%s | SnapSell AI" },
  description: "Upload photos. AI enhances them. Generates the perfect listing. Ready in under 30 seconds.",
  keywords: ["AI listing generator", "Vinted", "Leboncoin", "Facebook Marketplace", "eBay", "reselling tools", "photo enhancement"],
  openGraph: {
    title: "SnapSell AI — Sell your items faster with AI",
    description: "Upload photos. AI enhances them and generates the perfect listing in seconds.",
    type: "website",
    siteName: "SnapSell AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "SnapSell AI",
    description: "Sell your items faster with AI-powered listings.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
