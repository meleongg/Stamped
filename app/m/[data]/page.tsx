import { STATUS_LABELS } from "@/app/constants";
import { SharedMapView } from "@/app/m/[data]/SharedMapView";
import { TravelStatus } from "@/app/types";
import { InvalidShareLinkError, decodeMap } from "@/app/utils/share";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";

interface PageParams {
  data: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

const statusOrder: TravelStatus[] = ["visited", "planning", "want_to_visit"];

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { data: encoded } = await params;
  try {
    const decoded = decodeMap(encoded);
    const counts = countByStatus(decoded.data);
    const visited = counts.visited || 0;
    const planning = counts.planning || 0;
    const total = Object.keys(decoded.data).length;
    const subtitle =
      total === 0
        ? "Track your travels on a world map"
        : `${visited} visited · ${planning} planning · ${total} total`;
    const title = `${decoded.name}'s travel map`;
    return {
      title,
      description: subtitle,
      openGraph: {
        title,
        description: subtitle,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: subtitle,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  } catch {
    return {
      title: "Shared travel map",
      description: "Someone shared their travel map with you.",
      robots: { index: false, follow: false },
    };
  }
}

function countByStatus(data: Record<string, { status: TravelStatus }>) {
  const result: Partial<Record<TravelStatus, number>> = {};
  for (const entry of Object.values(data)) {
    result[entry.status] = (result[entry.status] || 0) + 1;
  }
  return result;
}

export default async function SharedMapPage({ params }: PageProps) {
  const { data: encoded } = await params;
  let decoded;
  try {
    decoded = decodeMap(encoded);
  } catch (error) {
    const message =
      error instanceof InvalidShareLinkError
        ? error.message
        : "Couldn't read this share link.";
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
          This share link looks broken
        </h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          {message}
        </p>
        <Button asChild variant="default">
          <Link href="/">Go to your own map</Link>
        </Button>
      </div>
    );
  }

  const counts = countByStatus(decoded.data);
  const total = Object.keys(decoded.data).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {decoded.name}&apos;s travel map
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {total === 0
            ? "No countries marked yet."
            : statusOrder
                .map(
                  (s) => `${counts[s] || 0} ${STATUS_LABELS[s].toLowerCase()}`,
                )
                .join(" · ")}
        </p>
      </div>

      <SharedMapView encoded={encoded} ownerName={decoded.name} />
    </div>
  );
}
