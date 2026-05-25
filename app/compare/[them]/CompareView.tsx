"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MapView } from "@/app/components/MapView";
import { MapData, TravelStatus } from "@/app/types";
import { CountryFeature, loadCountries } from "@/app/utils/geo";
import {
  localStorageStore,
  mergeMapData,
} from "@/app/utils/storage";

interface CompareViewProps {
  theirEncoded: string;
  theirName: string;
  theirData: MapData;
}

type OverlayCategory = "both" | "onlyMine" | "onlyTheirs" | "neither";

const CATEGORY_COLORS: Record<OverlayCategory, string> = {
  both: "#22c55e", // green
  onlyMine: "#3b82f6", // blue
  onlyTheirs: "#f59e0b", // amber
  neither: "#e0e7ff", // light fill
};

const CATEGORY_LABELS: Record<OverlayCategory, string> = {
  both: "Both of us",
  onlyMine: "Only me",
  onlyTheirs: "Only them",
  neither: "Neither",
};

const isVisited = (entry: { status: TravelStatus } | undefined) =>
  entry?.status === "visited";

export const CompareView: React.FC<CompareViewProps> = ({
  theirEncoded,
  theirName,
  theirData,
}) => {
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mine, setMine] = useState<MapData>({});
  const [mineLoading, setMineLoading] = useState(true);

  useEffect(() => {
    setCountries(loadCountries());
    setIsMapLoading(false);
  }, []);

  useEffect(() => {
    Promise.resolve(localStorageStore.load()).then((data) => {
      setMine(data);
      setMineLoading(false);
    });
  }, []);

  const getCategory = (countryCode: string): OverlayCategory => {
    const m = isVisited(mine[countryCode]);
    const t = isVisited(theirData[countryCode]);
    if (m && t) return "both";
    if (m && !t) return "onlyMine";
    if (!m && t) return "onlyTheirs";
    return "neither";
  };

  const getCountryFill = (countryCode: string): string => {
    return CATEGORY_COLORS[getCategory(countryCode)];
  };

  const stats = useMemo(() => {
    const result: Record<OverlayCategory, number> = {
      both: 0,
      onlyMine: 0,
      onlyTheirs: 0,
      neither: 0,
    };
    const allCodes = new Set<string>([
      ...Object.keys(mine),
      ...Object.keys(theirData),
    ]);
    for (const code of allCodes) {
      const cat = getCategory(code);
      if (cat !== "neither") result[cat]++;
    }
    return result;
  }, [mine, theirData]); // eslint-disable-line react-hooks/exhaustive-deps

  const uniqueToThem = useMemo(() => {
    return Object.entries(theirData)
      .filter(([code, entry]) => entry.status === "visited" && !isVisited(mine[code]))
      .map(([code]) => code);
  }, [mine, theirData]);

  const handleImportTheirUnique = async () => {
    try {
      const toAdd: MapData = {};
      for (const code of uniqueToThem) {
        toAdd[code] = { countryCode: code, status: "want_to_visit" };
      }
      const merged = mergeMapData(mine, toAdd, "keep-mine");
      await Promise.resolve(localStorageStore.save(merged));
      setMine(merged);
      toast.success(
        `Added ${uniqueToThem.length} ${
          uniqueToThem.length === 1 ? "country" : "countries"
        } as "want to visit"`
      );
    } catch {
      toast.error("Couldn't import. Please try again.");
    }
  };

  if (mineLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading your map…
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            You vs {theirName}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Visited-country overlap. Plans and want-to-visit aren&apos;t counted here.
          </p>
        </div>
        <Button asChild variant="ghost">
          <Link href={`/m/${theirEncoded}`} className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Back to {theirName}&apos;s map
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Overlap
              </h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {(["both", "onlyMine", "onlyTheirs"] as OverlayCategory[]).map(
                (cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {cat === "onlyMine"
                          ? "Only me"
                          : cat === "onlyTheirs"
                          ? `Only ${theirName}`
                          : CATEGORY_LABELS[cat]}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    >
                      {stats[cat]}
                    </Badge>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {uniqueToThem.length > 0 && (
            <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Explore together
                </h3>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {theirName} has been to {uniqueToThem.length}{" "}
                  {uniqueToThem.length === 1 ? "country" : "countries"} you
                  haven&apos;t. Add them to your &quot;want to visit&quot; list?
                </p>
                <Button
                  variant="default"
                  className="w-full cursor-pointer"
                  onClick={handleImportTheirUnique}
                >
                  Add {uniqueToThem.length} to my list
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 w-full max-w-4xl mx-auto overflow-hidden flex items-center justify-center">
            <div className="w-full">
              <MapView
                getCountryStatus={() => null}
                getCountryFill={(code) => getCountryFill(code)}
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
