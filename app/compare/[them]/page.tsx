import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  type DecodedShare,
  InvalidShareLinkError,
  decodeMap,
} from "@/app/utils/share";
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
  const { them: encoded } = await params;

  let decoded: DecodedShare;
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <CompareView
        theirEncoded={encoded}
        theirName={decoded.name}
        theirData={decoded.data}
      />
    </div>
  );
}
