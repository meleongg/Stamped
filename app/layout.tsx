import { Analytics } from "@vercel/analytics/react";
import { Stamp } from "lucide-react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://stamped-travel.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Stamped — Your personal world travel map",
    template: "%s · Stamped",
  },
  description:
    "Stamped is a personal world travel map. Mark the countries you've visited, share your map with friends, and compare your travels side-by-side. No login required.",
  applicationName: "Stamped",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "Stamped",
    title: "Stamped — Your personal world travel map",
    description:
      "Mark the countries you've visited, share your map with friends, and compare your travels side-by-side.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Stamped — Your personal world travel map",
    description:
      "Mark the countries you've visited, share your map with friends, and compare your travels side-by-side.",
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
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href="/"
                    aria-label="Stamped home"
                    className="group flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-white"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white shadow-sm transition-transform duration-200 group-hover:-rotate-6 dark:bg-white dark:text-slate-900">
                      <Stamp className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                    <span className="leading-tight">
                      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
                        Stamped
                      </h1>
                    </span>
                  </Link>
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
