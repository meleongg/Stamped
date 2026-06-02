import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  resolveShareOrThrow,
  ShareStoreError,
  shareStoreErrorToLinkError,
} from "@/app/lib/shareStore";
import { CompareView } from "@/app/compare/[them]/CompareView";

interface PageParams {
  them: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

export const metadata = {
  title: "Compare travel maps",
  robots: { index: false, follow: false },
};

export default async function ComparePage({ params }: PageProps) {
  const { them: shareId } = await params;

  let share = null;
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <CompareView
        theirShareId={shareId}
        theirMapName={share.name}
        theirData={share.data}
      />
    </div>
  );
}
