"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const LAST_UPDATED = "May 28, 2026";

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
        <h1 className="text-foreground text-3xl font-bold">Privacy Policy</h1>
      </div>

      <div className="border-border bg-card rounded-lg border p-8 shadow-md">
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-muted-foreground mb-6">
            <strong>Last updated:</strong> {LAST_UPDATED}
          </p>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Data Collection and Storage
          </h2>
          <p className="text-muted-foreground mb-4">
            Stamped is local-first: your full travel map — including notes and
            visit dates — is stored in your browser by default. We do not
            require an account, and we do not collect your email or other
            profile information.
          </p>
          <p className="text-muted-foreground mb-4">
            If you choose to generate a share link, a limited snapshot of your
            map (map name, country statuses, and city statuses only) is stored
            on our servers for up to 90 days so others can view it. See{" "}
            <strong>Share Links</strong> below.
          </p>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Local Storage
          </h2>
          <p className="text-muted-foreground mb-4">
            Your complete travel data — country statuses, notes, and visit dates
            — is stored in your browser&apos;s <code>localStorage</code>. This
            data:
          </p>
          <ul className="text-muted-foreground mb-4 ml-6 list-disc">
            <li>Remains on your device unless you share a link (see below)</li>
            <li>
              Is not uploaded to our servers except when you explicitly create
              or update a share link
            </li>
            <li>Can be cleared at any time by clearing your browser data</li>
            <li>Is not accessible to other websites</li>
          </ul>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Share Links
          </h2>
          <p className="text-muted-foreground mb-4">
            When you generate a share link, the following information is stored
            on our servers (Upstash Redis) for up to 90 days and is viewable by
            anyone you send the link to:
          </p>
          <ul className="text-muted-foreground mb-4 ml-6 list-disc">
            <li>The display name you chose for the share</li>
            <li>
              The list of countries you&apos;ve marked, with their statuses
              (visited / planning / want to visit)
            </li>
            <li>
              The list of cities you&apos;ve stamped, with their statuses
              (visited / planning / want to visit)
            </li>
          </ul>
          <p className="text-muted-foreground mb-4">
            Share snapshots are deleted automatically after 90 days. Opening
            Share again from the same browser updates the stored snapshot and
            extends the expiry. Your browser keeps an anonymous edit token
            locally for this purpose — we do not store your email, account, or
            device identity with the share.
          </p>
          <p className="text-muted-foreground mb-4">
            Your <strong>notes and visit dates are never included</strong> in
            share links. They stay on your device.
          </p>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Third-Party Services
          </h2>
          <p className="text-muted-foreground mb-4">
            We use the following third-party services:
          </p>
          <ul className="text-muted-foreground mb-4 ml-6 list-disc">
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
              <strong>
                <a
                  href="https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Natural Earth Populated Places
                </a>
              </strong>{" "}
              — city names and coordinates (filtered subset), bundled locally
            </li>
            <li>
              <strong>Upstash Redis</strong> — ephemeral storage for share link
              snapshots (map name, country/city statuses only). Data expires
              after 90 days. See{" "}
              <a
                href="https://upstash.com/trust"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Upstash&apos;s privacy documentation
              </a>
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

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Data Security
          </h2>
          <p className="text-muted-foreground mb-4">
            Your full map (including notes and visit dates) stays in your
            browser. Share snapshots on our servers contain only the fields
            listed above. We recommend keeping your browser and device updated.
          </p>

          <h2 className="text-foreground mb-4 text-xl font-semibold">
            Contact Information
          </h2>
          <p className="text-muted-foreground mb-4">
            For questions about this Privacy Policy, please contact us through
            our GitHub repository.
          </p>
        </div>
      </div>
    </div>
  );
}
