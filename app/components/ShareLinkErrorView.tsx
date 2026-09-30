import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  describeShareLinkError,
  type ShareLinkErrorCode,
} from "@/app/utils/share";
import { Link2Off } from "lucide-react";

interface ShareLinkErrorViewProps {
  code?: ShareLinkErrorCode | null;
}

export function ShareLinkErrorView({ code }: ShareLinkErrorViewProps) {
  const copy = describeShareLinkError(code);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <div
        className="bg-muted text-muted-foreground mb-5 flex h-12 w-12 items-center justify-center rounded-full"
        aria-hidden
      >
        <Link2Off className="h-5 w-5" />
      </div>
      <h1 className="text-foreground mb-2 text-2xl font-bold tracking-tight">
        {copy.title}
      </h1>
      <p className="text-muted-foreground mb-2 text-sm leading-relaxed">
        {copy.message}
      </p>
      <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
        {copy.nextStep}
      </p>
      <Button asChild variant="default">
        <Link href="/">Go to your own map</Link>
      </Button>
    </div>
  );
}
