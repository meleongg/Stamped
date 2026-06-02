import { STATUS_LABELS } from "@/app/constants";
import { SharedMapView } from "@/app/m/[data]/SharedMapView";
import { resolveShareOrThrow, ShareStoreError } from "@/app/lib/shareStore";
import { TravelStatus } from "@/app/types";
import {
  formatSharedMapHeading,
  formatSharedMapPageTitle,
} from "@/app/utils/share";
import { shareStoreErrorToLinkError } from "@/app/lib/shareStore";
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

function countByStatus(data: Record<string, { status: TravelStatus }>) {
  const result: Partial<Record<TravelStatus, number>> = {};
  for (const entry of Object.values(data)) {
    result[entry.status] = (result[entry.status] || 0) + 1;
  }
  return result;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { data: shareId } = await params;
  try {
    const share = await resolveShareOrThrow(shareId);
    const counts = countByStatus(share.data.countries);
    const visited = counts.visited || 0;
    const planning = counts.planning || 0;
    const total = Object.keys(share.data.countries).length;
    const cityCount = Object.keys(share.data.cities).length;
    const subtitle =
      total === 0 && cityCount === 0
        ? "Track your travels on a world map"
        : `${visited} visited · ${planning} planning · ${total} total${cityCount > 0 ? ` · ${cityCount} cities` : ""}`;
    const socialTitle = formatSharedMapPageTitle(share.name);
    const ogImage = `/m/${shareId}/opengraph-image?v=${encodeURIComponent(share.expiresAt)}`;
    return {
      title: share.name,
      description: subtitle,
      openGraph: {
        title: socialTitle,
        description: subtitle,
        type: "website",
        images: [{ url: ogImage, width: 1200, height: 630, alt: socialTitle }],
      },
      twitter: {
        card: "summary_large_image",
        title: socialTitle,
        description: subtitle,
        images: [ogImage],
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

function ShareLinkErrorPage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="text-foreground mb-3 text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mb-6 text-sm">{message}</p>
      <Button asChild variant="default">
        <Link href="/">Go to your own map</Link>
      </Button>
    </div>
  );
}

export default async function SharedMapPage({ params }: PageProps) {
  const { data: shareId } = await params;

  let share;
  try {
    share = await resolveShareOrThrow(shareId);
  } catch (error) {
    const linkError =
      error instanceof ShareStoreError
        ? shareStoreErrorToLinkError(error)
        : null;
    const title =
      linkError?.code === "expired"
        ? "This share link has expired"
        : "This share link looks broken";
    const message =
      linkError?.message ??
      "Couldn't read this share link. Ask the sender to share again.";
    return <ShareLinkErrorPage title={title} message={message} />;
  }

  const counts = countByStatus(share.data.countries);
  const total = Object.keys(share.data.countries).length;
  const cityCount = Object.keys(share.data.cities).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-foreground text-3xl font-bold">
          {formatSharedMapHeading(share.name)}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {total === 0 && cityCount === 0
            ? "No countries marked yet."
            : [
                ...statusOrder.map(
                  (s) => `${counts[s] || 0} ${STATUS_LABELS[s].toLowerCase()}`,
                ),
                cityCount > 0 ? `${cityCount} cities` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
        </p>
      </div>

      <SharedMapView
        shareId={shareId}
        mapName={share.name}
        sharedData={share.data}
      />
    </div>
  );
}
