"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsOfService() {
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
          Terms of Service
        </h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <div className="prose dark:prose-invert max-w-none">
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Acceptance of Terms
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            By using Personal World Map, you agree to these Terms of Service. If
            you do not agree with these terms, please do not use the
            application.
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Description of Service
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Personal World Map is a free, client-side web application that
            allows users to track their travel history and plan future trips by
            marking countries on an interactive world map. All data is stored
            locally in your browser.
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Use of the Service
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            You may use this service for personal, non-commercial purposes. You
            agree to:
          </p>
          <ul className="mb-4 ml-6 list-disc text-gray-700 dark:text-gray-300">
            <li>Use the service only for lawful purposes</li>
            <li>
              Not attempt to interfere with the service&apos;s functionality
            </li>
            <li>Not use the service to distribute malicious content</li>
            <li>Respect the intellectual property rights of others</li>
          </ul>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Data and Privacy
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            All your data is stored locally in your browser. We do not have
            access to your personal travel data. You are responsible for backing
            up your data if desired, as clearing your browser data will remove
            your travel information.
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Disclaimer of Warranties
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            The service is provided &quot;as is&quot; without warranties of any
            kind. We do not guarantee that the service will be uninterrupted,
            error-free, or completely secure.
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Limitation of Liability
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            In no event shall Personal World Map be liable for any indirect,
            incidental, special, or consequential damages arising from your use
            of the service.
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Third-Party Content
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            The map data is provided by third-party sources. We are not
            responsible for the accuracy or completeness of geographic
            information.
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Changes to Terms
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            We reserve the right to modify these terms at any time. Changes will
            be effective immediately upon posting. Your continued use of the
            service constitutes acceptance of the modified terms.
          </p>

          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Contact Information
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            For questions about these Terms of Service, please contact us
            through our GitHub repository.
          </p>
        </div>
      </div>
    </div>
  );
}
