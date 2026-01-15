import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Half-Hour Productivity Tracker",
  description: "Track your daily activities in 30-minute intervals. Build better habits, analyze productivity patterns, and export data for insights.",
  keywords: ["productivity", "time tracking", "habits", "time blocks", "focus"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1a2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#1a1a2e]`}>
        {children}
      </body>
    </html>
  );
}
