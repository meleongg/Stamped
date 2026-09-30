import { ShareLinkErrorView } from "@/app/components/ShareLinkErrorView";
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
    return <ShareLinkErrorView code={linkError?.code ?? null} />;
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
