"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Download, GitCompareArrows, Home } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { track } from "@vercel/analytics";
import { ShareDialog } from "@/app/components/ShareDialog";
import { TravelMapData } from "@/app/types";
import { cn } from "@/lib/utils";

type ImportStrategy = "keep-mine" | "use-theirs";

const IMPORT_OPTIONS: {
  id: ImportStrategy;
  title: string;
  description: string;
}[] = [
  {
    id: "keep-mine",
    title: "Add places I don't have",
    description: "My existing entries stay the same.",
  },
  {
    id: "use-theirs",
    title: "Overwrite with their map",
    description: "Conflicts use their map's data.",
  },
];

interface SharedMapActionsProps {
  shareId: string;
  mapName: string;
  sharedData: TravelMapData;
  myData: TravelMapData;
  onImported: (merged: TravelMapData) => void;
}

export const SharedMapActions: React.FC<SharedMapActionsProps> = ({
  shareId,
  mapName,
  sharedData,
  myData,
  onImported,
}) => {
  const [importOpen, setImportOpen] = useState(false);
  const [importStrategy, setImportStrategy] = useState<ImportStrategy | null>(
    null,
  );

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy. Select the URL and copy manually.");
    }
  };

  const handleImport = async (strategy: ImportStrategy) => {
    const { localStorageStore, mergeTravelMapData } =
      await import("@/app/utils/storage");
    try {
      const mine = await Promise.resolve(localStorageStore.load());
      const merged = mergeTravelMapData(mine, sharedData, strategy);
      await Promise.resolve(localStorageStore.save(merged));
      onImported(merged);
      const addedCountries =
        Object.keys(merged.countries).length -
        Object.keys(mine.countries).length;
      const addedCities =
        Object.keys(merged.cities).length - Object.keys(mine.cities).length;
      toast.success(
        strategy === "keep-mine"
          ? `Added ${addedCountries} ${addedCountries === 1 ? "country" : "countries"} and ${addedCities} ${addedCities === 1 ? "city" : "cities"} from ${mapName}`
          : `Replaced overlapping entries with ${mapName}`,
      );
      track("share_link_imported", { strategy, added: addedCountries });
      setImportStrategy(null);
      setImportOpen(false);
    } catch {
      toast.error("Couldn't import. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        asChild
        variant="default"
        size="lg"
        className="flex w-full cursor-pointer items-center justify-center gap-2 font-semibold shadow-md"
      >
        <Link href="/">
          <Home className="h-4 w-4" />
          Create your own map
        </Link>
      </Button>

      <div className="border-border bg-card flex flex-col gap-2 rounded-lg border p-4 shadow-md">
        <p className="text-muted-foreground text-xs font-medium">
          Already using Stamped?
        </p>
        <Button
          onClick={handleCopyLink}
          variant="outline"
          className="flex w-full cursor-pointer items-center justify-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Copy share link
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link
            href={`/compare/${shareId}`}
            className="flex items-center justify-center gap-2"
          >
            <GitCompareArrows className="h-4 w-4" />
            Compare with my map
          </Link>
        </Button>
        <Dialog
          open={importOpen}
          onOpenChange={(open) => {
            setImportOpen(open);
            if (!open) setImportStrategy(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="flex w-full cursor-pointer items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Import to my map
            </Button>
          </DialogTrigger>
          <DialogContent className="gap-5">
            <DialogHeader className="gap-2 pr-8">
              <DialogTitle>Import from {mapName}?</DialogTitle>
              <DialogDescription>
                Pick what to do when a country or city appears on both maps.
              </DialogDescription>
            </DialogHeader>
            <div
              className="flex flex-col gap-3"
              role="radiogroup"
              aria-label="Import strategy"
            >
              {IMPORT_OPTIONS.map((option) => {
                const selected = importStrategy === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setImportStrategy(option.id)}
                    className={cn(
                      "h-auto w-full cursor-pointer rounded-md border px-4 py-3.5 text-left whitespace-normal transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <div className="flex w-full flex-col gap-1">
                      <span className="font-semibold">{option.title}</span>
                      <span
                        className={cn(
                          "text-xs",
                          selected ? "opacity-90" : "text-muted-foreground",
                        )}
                      >
                        {option.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <DialogFooter className="gap-2 pt-0 sm:justify-between">
              <Button
                variant="ghost"
                className="cursor-pointer"
                onClick={() => setImportOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="cursor-pointer"
                disabled={!importStrategy}
                onClick={() => {
                  if (importStrategy) void handleImport(importStrategy);
                }}
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <ShareDialog travelMapData={myData} triggerVariant="outline" />
      </div>
    </div>
  );
};
