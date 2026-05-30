import { Analytics } from "@vercel/analytics/react";
import { Stamp } from "lucide-react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
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

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["600", "700"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}
      >
        <JsonLd data={webApplicationLd(SITE_URL)} />
        <ThemeProvider>
          <div className="bg-background flex min-h-screen flex-col">
            <header className="bg-card border-border border-b shadow-sm">
              <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href="/"
                    aria-label="Stamped home"
                    className="group flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:focus-visible:ring-sky-400"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-sky-600 text-white shadow-sm transition-transform duration-200 group-hover:-rotate-6 dark:bg-sky-400 dark:text-slate-900">
                      <Stamp className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                    <span className="leading-tight">
                      <h1 className="font-wordmark text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
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
