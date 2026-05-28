"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const LAST_UPDATED = "May 26, 2026";

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
            <strong>Last updated:</strong> {LAST_UPDATED}
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Data Collection and Storage
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Stamped is a client-side application. Your travel data is stored
            locally in your browser and is not transmitted to or stored on any
            of our servers.
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Local Storage
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Your travel data — country statuses, notes, and visit dates — is
            stored in your browser&apos;s <code>localStorage</code>. This data:
          </p>
          <ul className="mb-4 ml-6 list-disc text-gray-700 dark:text-gray-300">
            <li>Remains on your device only</li>
            <li>Is not transmitted to any external servers by Stamped</li>
            <li>Can be cleared at any time by clearing your browser data</li>
            <li>Is not accessible to other websites</li>
          </ul>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Share Links
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            When you generate a share link, the following information is encoded
            into the URL itself (and therefore visible to anyone you send the
            link to):
          </p>
          <ul className="mb-4 ml-6 list-disc text-gray-700 dark:text-gray-300">
            <li>The display name you chose for the share</li>
            <li>
              The list of countries you&apos;ve marked, with their statuses
              (visited / planning / want to visit)
            </li>
          </ul>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Your <strong>notes and visit dates are never included</strong> in
            share links. They stay on your device.
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Third-Party Services
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            We use the following third-party services:
          </p>
          <ul className="mb-4 ml-6 list-disc text-gray-700 dark:text-gray-300">
            <li>
              <strong>
                <a
                  href="https://www.naturalearthdata.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Natural Earth
                </a>
              </strong>{" "}
              — country boundary and name data (Admin 0 countries), bundled for
              map display
            </li>
            <li>
              <strong>
                <a
                  href="https://github.com/topojson/world-atlas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  world-atlas
                </a>
              </strong>{" "}
              — TopoJSON packaging of Natural Earth data (ISC License)
            </li>
            <li>
              <strong>Vercel</strong> — hosting, deployment, and bandwidth
              delivery
            </li>
            <li>
              <strong>Vercel Analytics</strong> — privacy-friendly, cookie-less
              aggregate analytics. It records anonymized page views and a small
              number of custom events (such as &quot;share link copied&quot;)
              for product analytics. It does not collect personally identifiable
              information and does not use cross-site tracking. See{" "}
              <a
                href="https://vercel.com/docs/analytics/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Vercel&apos;s analytics privacy policy
              </a>{" "}
              for details.
            </li>
          </ul>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Data Security
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Since all map data is stored locally in your browser, the security
            of that data depends on your device&apos;s security. We recommend
            keeping your browser and device updated.
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
