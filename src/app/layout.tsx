import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Define the base URL
const baseUrl = "https://focusry.vercel.app/";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Focusry | 30-Minute Productivity Tracker",
    template: "%s | Focusry",
  },
  description: "Focusry is a productivity tracking app that helps you log your work in focused 30-minute intervals, analyze progress over time, and export insights to improve consistency and performance.",
  keywords: [
    "productivity tracker",
    "time tracking app",
    "30 minute productivity",
    "focus tracking",
    "work interval tracking",
    "habit tracking",
    "personal analytics",
    "productivity analytics",
    "export productivity data",
    "developer productivity"
  ],
  authors: [{ name: "Shishir Shetty", url: "https://github.com/shishirshetty77/productivity-tracker.git" }],
  creator: "Shishir Shetty",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    title: "Focusry | Master Your Day in 30-Minute Blocks",
    description: "Log focused work intervals, analyze progress, and export insights. Build consistency with Focusry.",
    siteName: "Focusry",
    images: [
      {
        url: "/og-image.png", 
        width: 1200,
        height: 630,
        alt: "Focusry Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Focusry | 30-Minute Productivity Tracker",
    description: "Focusry is a productivity tracking app that helps you log your work in focused 30-minute intervals.",
    images: ["/og-image.png"],
    creator: "@shishirshetty07",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#191919",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#191919]`}>
        {children}
      </body>
    </html>
  );
}
