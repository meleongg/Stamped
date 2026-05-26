"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Map
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Privacy Policy
        </h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="prose dark:prose-invert max-w-none">
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Data Collection and Storage
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Personal World Map is a client-side application that stores all data
            locally in your browser. We do not collect, transmit, or store any
            personal information on external servers.
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Local Storage
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Your travel data, including country statuses, notes, and visit
            dates, is stored locally in your browser&apos;s localStorage. This
            data:
          </p>
          <ul className="mb-4 ml-6 list-disc text-gray-700 dark:text-gray-300">
            <li>Remains on your device only</li>
            <li>Is not transmitted to any external servers</li>
            <li>Can be cleared by clearing your browser data</li>
            <li>Is not accessible to other websites</li>
          </ul>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Third-Party Services
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            We use the following third-party services:
          </p>
          <ul className="mb-4 ml-6 list-disc text-gray-700 dark:text-gray-300">
            <li>
              <strong>World Atlas CDN:</strong> For loading geographic map data
              (countries-110m.json)
            </li>
            <li>
              <strong>Vercel (if hosted):</strong> For website hosting and
              delivery
            </li>
          </ul>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Analytics and Tracking
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            We do not use any analytics, tracking, or monitoring services. No
            user behavior data is collected.
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Data Security
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Since all data is stored locally in your browser, the security of
            your data depends on your device&apos;s security measures. We
            recommend keeping your browser and device updated.
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Contact Information
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            For questions about this Privacy Policy, please contact us through
            our GitHub repository.
          </p>
        </div>
      </div>
    </div>
  );
}
