import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";
import { Footer } from "./components/Footer";
import { JsonLd, webApplicationLd } from "./components/JsonLd";
import { ThemeToggle } from "./components/ThemeToggle";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://personal-world-map.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Personal World Map",
    template: "%s · Personal World Map",
  },
  description:
    "Track your travels and plan your next adventures on an interactive world map. No login required.",
  applicationName: "Personal World Map",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "Personal World Map",
    title: "Personal World Map",
    description:
      "Track your travels and plan your next adventures on an interactive world map.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal World Map",
    description:
      "Track your travels and plan your next adventures on an interactive world map.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <JsonLd data={webApplicationLd(SITE_URL)} />
        <ThemeProvider>
          <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
            <header className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Personal World Map
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      Track your travels and plan your next adventures
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <main className="flex-1">{children}</main>

            <Footer />
          </div>
          <Toaster
            position="bottom-center"
            theme="system"
            richColors
            closeButton={false}
            duration={2500}
          />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
