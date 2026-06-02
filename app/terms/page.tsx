"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const LAST_UPDATED = "May 26, 2026";

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
        <h1 className="text-foreground text-3xl font-bold">Terms of Service</h1>
      </div>

      <div className="border-border bg-card rounded-lg border p-8 shadow-md">
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            <strong>Last updated:</strong> {LAST_UPDATED}
          </p>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Acceptance of Terms
          </h2>
          <p className="text-muted-foreground mb-4">
            By using Stamped, you agree to these Terms of Service. If you do not
            agree with these terms, please do not use the application.
          </p>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Description of Service
          </h2>
          <p className="text-muted-foreground mb-4">
            Stamped is a free, client-side web application that allows users to
            track their travel history and plan future trips by marking
            countries on an interactive world map. All map data is stored
            locally in your browser.
          </p>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Use of the Service
          </h2>
          <p className="text-muted-foreground mb-4">
            You may use this service for personal, non-commercial purposes. You
            agree to:
          </p>
          <ul className="text-muted-foreground mb-4 ml-6 list-disc">
            <li>Use the service only for lawful purposes</li>
            <li>
              Not attempt to interfere with the service&apos;s functionality
            </li>
            <li>Not use the service to distribute malicious content</li>
            <li>Respect the intellectual property rights of others</li>
          </ul>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Sharing and Share Links
          </h2>
          <p className="text-muted-foreground mb-4">
            When you generate a share link, the display name you chose and your
            country and city statuses are stored on our servers for up to 90
            days. Anyone with the link can view that information until it
            expires. You are responsible for the content of share links you
            generate and for who you share them with. Notes and visit dates are
            never included in share links.
          </p>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Data and Privacy
          </h2>
          <p className="text-muted-foreground mb-4">
            All your map data is stored locally in your browser. We do not have
            access to your personal travel data. You are responsible for backing
            up your data if desired, as clearing your browser data will remove
            your travel information. See our{" "}
            <Link
              href="/privacy"
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Privacy Policy
            </Link>{" "}
            for details on third-party services we use.
          </p>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Disclaimer of Warranties
          </h2>
          <p className="text-muted-foreground mb-4">
            The service is provided &quot;as is&quot; without warranties of any
            kind. We do not guarantee that the service will be uninterrupted,
            error-free, or completely secure.
          </p>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Limitation of Liability
          </h2>
          <p className="text-muted-foreground mb-4">
            In no event shall Stamped be liable for any indirect, incidental,
            special, or consequential damages arising from your use of the
            service.
          </p>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Third-Party Content
          </h2>
          <p className="text-muted-foreground mb-4">
            The map data is provided by third-party sources. We are not
            responsible for the accuracy or completeness of geographic
            information, including country boundaries and naming.
          </p>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Changes to Terms
          </h2>
          <p className="text-muted-foreground mb-4">
            We reserve the right to modify these terms at any time. Changes will
            be effective immediately upon posting. Your continued use of the
            service constitutes acceptance of the modified terms.
          </p>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Contact Information
          </h2>
          <p className="text-muted-foreground mb-4">
            For questions about these Terms of Service, please contact us
            through our GitHub repository.
          </p>
        </div>
      </div>
    </div>
  );
}
