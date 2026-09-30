import { STATUS_LABELS } from "@/app/constants";
import { ShareLinkErrorView } from "@/app/components/ShareLinkErrorView";
import { SharedMapView } from "@/app/m/[data]/SharedMapView";
import { resolveShareOrThrow, ShareStoreError } from "@/app/lib/shareStore";
import { TravelStatus } from "@/app/types";
import {
  formatShareExpiryLabel,
  formatSharedMapHeading,
  formatSharedMapPageTitle,
} from "@/app/utils/share";
import { shareStoreErrorToLinkError } from "@/app/lib/shareStore";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

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
    return <ShareLinkErrorView code={linkError?.code ?? null} />;
  }

  const counts = countByStatus(share.data.countries);
  const total = Object.keys(share.data.countries).length;
  const cityCount = Object.keys(share.data.cities).length;
  const isEmpty = total === 0 && cityCount === 0;
  const summary = isEmpty
    ? "This shared map does not have any places yet."
    : [
        ...statusOrder.map(
          (s) => `${counts[s] || 0} ${STATUS_LABELS[s].toLowerCase()}`,
        ),
        cityCount > 0 ? `${cityCount} cities` : null,
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Shared map
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-foreground text-3xl font-bold tracking-tight">
              {formatSharedMapHeading(share.name)}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{summary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Read-only</Badge>
            <Badge variant="outline">Notes not shared</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          {formatShareExpiryLabel(share.expiresAt)}
        </p>
      </header>

      <SharedMapView
        shareId={shareId}
        mapName={share.name}
        sharedData={share.data}
      />
    </div>
  );
}
