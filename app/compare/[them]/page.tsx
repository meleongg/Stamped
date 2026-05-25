import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InvalidShareLinkError, decodeMap } from "@/app/utils/share";
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
  try {
    const decoded = decodeMap(encoded);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CompareView
          theirEncoded={encoded}
          theirName={decoded.name}
          theirData={decoded.data}
        />
      </div>
    );
  } catch (error) {
    const message =
      error instanceof InvalidShareLinkError
        ? error.message
        : "Couldn't read this share link.";
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          This share link looks broken
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>
        <Button asChild variant="default">
          <Link href="/">Go to your own map</Link>
        </Button>
      </div>
    );
  }
}
