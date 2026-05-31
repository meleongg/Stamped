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
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { track } from "@vercel/analytics";
import { CountrySearch } from "@/app/components/CountrySearch";
import { Legend } from "@/app/components/Legend";
import { MapView, MapViewHandle } from "@/app/components/MapView";
import { ShareDialog } from "@/app/components/ShareDialog";
import { Stats } from "@/app/components/Stats";
import { CityCatalogEntry, TravelMapData, TravelStatus } from "@/app/types";
import { CountryFeature, loadCountries } from "@/app/utils/geo";
import { decodeMap } from "@/app/utils/share";
import { computeStats } from "@/app/utils/stats";
import { localStorageStore, mergeTravelMapData } from "@/app/utils/storage";
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

interface SharedMapViewProps {
  encoded: string;
  mapName: string;
}

export const SharedMapView: React.FC<SharedMapViewProps> = ({
  encoded,
  mapName,
}) => {
  const [countries] = useState<CountryFeature[]>(() => loadCountries());
  const [myData, setMyData] = useState<TravelMapData>({
    countries: {},
    cities: {},
  });
  const mapRef = useRef<MapViewHandle>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve(localStorageStore.load()).then((d) => {
      if (!cancelled) setMyData(d);
    });
    track("share_link_viewed");
    return () => {
      cancelled = true;
    };
  }, []);

  const decoded = useMemo(() => decodeMap(encoded), [encoded]);
  const stats = useMemo(() => computeStats(decoded.data), [decoded.data]);

  const getCountryStatus = (countryCode: string): TravelStatus | null => {
    return decoded.data.countries[countryCode]?.status || null;
  };

  const counts = useMemo(() => {
    return Object.values(decoded.data.countries).reduce(
      (acc, entry) => {
        acc[entry.status] = (acc[entry.status] || 0) + 1;
        return acc;
      },
      {} as Record<TravelStatus, number>,
    );
  }, [decoded.data]);

  const sharedCities = useMemo(
    () => Object.values(decoded.data.cities),
    [decoded.data.cities],
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

  const [importOpen, setImportOpen] = useState(false);
  const [importStrategy, setImportStrategy] = useState<ImportStrategy | null>(
    null,
  );
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const getCityStatus = (cityId: string): TravelStatus | null =>
    decoded.data.cities[cityId]?.status ?? null;

  const handleImport = async (strategy: "keep-mine" | "use-theirs") => {
    try {
      const mine = await Promise.resolve(localStorageStore.load());
      const merged = mergeTravelMapData(mine, decoded.data, strategy);
      await Promise.resolve(localStorageStore.save(merged));
      setMyData(merged);
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

  const handleSearchSelectCountry = (countryCode: string) => {
    if (!getCountryStatus(countryCode)) return;
    setSelectedCityId(null);
    mapRef.current?.focusCountry(countryCode);
  };

  const handleSearchSelectCity = (city: CityCatalogEntry) => {
    if (!getCityStatus(city.id)) return;
    setSelectedCityId(city.id);
    mapRef.current?.focusCity(city.id, city.lat, city.lng);
  };

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Legend counts={counts} />
          <Stats stats={stats} />

          <div className="border-border bg-card flex flex-col gap-2 rounded-lg border p-4 shadow-md">
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
                href={`/compare/${encoded}`}
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
                  variant="default"
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
            <Button asChild variant="ghost" className="w-full">
              <Link href="/" className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4" />
                Go to my own map
              </Link>
            </Button>
          </div>

          <ShareDialog travelMapData={myData} />
        </div>

        <div className="flex flex-col gap-3 lg:col-span-3">
          <CountrySearch
            countries={countries}
            getCountryStatus={getCountryStatus}
            getCityStatus={getCityStatus}
            onSelectCountry={handleSearchSelectCountry}
            onSelectCity={handleSearchSelectCity}
            placeholder={`Search countries & cities in ${mapName}…`}
          />
          <div className="border-border bg-card mx-auto flex w-full max-w-4xl items-center justify-center overflow-hidden rounded-lg border p-4 shadow-md">
            <div className="w-full">
              <MapView
                ref={mapRef}
                getCountryStatus={getCountryStatus}
                stampedCities={sharedCities}
                selectedCityId={selectedCityId}
                countries={countries}
                isLoading={false}
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
