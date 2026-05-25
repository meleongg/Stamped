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
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Legend } from "@/app/components/Legend";
import { MapView } from "@/app/components/MapView";
import { TravelStatus } from "@/app/types";
import { CountryFeature, loadCountries } from "@/app/utils/geo";
import { decodeMap } from "@/app/utils/share";
import {
  localStorageStore,
  mergeMapData,
} from "@/app/utils/storage";

interface SharedMapViewProps {
  encoded: string;
  ownerName: string;
}

export const SharedMapView: React.FC<SharedMapViewProps> = ({
  encoded,
  ownerName,
}) => {
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [isMapLoading, setIsMapLoading] = useState(true);

  useEffect(() => {
    setCountries(loadCountries());
    setIsMapLoading(false);
  }, []);

  const decoded = useMemo(() => decodeMap(encoded), [encoded]);

  const getCountryStatus = (countryCode: string): TravelStatus | null => {
    return decoded.data[countryCode]?.status || null;
  };

  const counts = useMemo(() => {
    return Object.values(decoded.data).reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {} as Record<TravelStatus, number>);
  }, [decoded.data]);

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy. Select the URL and copy manually.");
    }
  };

  const [importOpen, setImportOpen] = useState(false);

  const handleImport = async (strategy: "keep-mine" | "use-theirs") => {
    try {
      const mine = await Promise.resolve(localStorageStore.load());
      const merged = mergeMapData(mine, decoded.data, strategy);
      await Promise.resolve(localStorageStore.save(merged));
      const added = Object.keys(merged).length - Object.keys(mine).length;
      toast.success(
        strategy === "keep-mine"
          ? `Added ${added} new ${added === 1 ? "country" : "countries"} from ${ownerName}'s map`
          : `Replaced overlapping countries with ${ownerName}'s statuses`
      );
      setImportOpen(false);
    } catch {
      toast.error("Couldn't import. Please try again.");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Legend counts={counts} />

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Copy share link
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link
                href={`/compare/${encoded}`}
                className="flex items-center justify-center gap-2"
              >
                <GitCompareArrows className="w-4 h-4" />
                Compare with my map
              </Link>
            </Button>
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  className="w-full flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Import to my map
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import {ownerName}&apos;s countries?</DialogTitle>
                  <DialogDescription>
                    Pick what to do when a country appears on both maps.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="default"
                    className="w-full justify-start"
                    onClick={() => handleImport("keep-mine")}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">
                        Add countries I don&apos;t have
                      </span>
                      <span className="text-xs opacity-80">
                        My existing statuses stay the same.
                      </span>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleImport("use-theirs")}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">
                        Overwrite with their statuses
                      </span>
                      <span className="text-xs opacity-80">
                        Conflicts use {ownerName}&apos;s statuses.
                      </span>
                    </div>
                  </Button>
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setImportOpen(false)}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button asChild variant="ghost" className="w-full">
              <Link
                href="/"
                className="flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go to my own map
              </Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-3 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 w-full max-w-4xl mx-auto overflow-hidden flex items-center justify-center">
            <div className="w-full">
              <MapView
                getCountryStatus={getCountryStatus}
                countries={countries}
                isLoading={isMapLoading}
                readonly
                showExport={false}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
