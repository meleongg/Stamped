"use client";

import { MapView } from "@/app/components/MapView";
import { STATUS_COLORS } from "@/app/constants";
import { MapData, TravelMapData, TravelStatus } from "@/app/types";
import {
  citiesInCountry,
  computeCityOverlap,
  OverlapCategory,
} from "@/app/utils/compare";
import { CountryFeature, loadCountries } from "@/app/utils/geo";
import {
  importTheirCities,
  localStorageStore,
  mergeMapData,
} from "@/app/utils/storage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Home, XIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface CompareViewProps {
  theirEncoded: string;
  theirMapName: string;
  theirData: TravelMapData;
}

type CountryOverlayCategory = OverlapCategory | "neither";

const CATEGORY_COLORS: Record<CountryOverlayCategory, string> = {
  both: "#22c55e",
  onlyMine: "#3b82f6",
  onlyTheirs: "#f59e0b",
  neither: "#94a3b8",
};

const CATEGORY_LABELS: Record<OverlapCategory, string> = {
  both: "Both of us",
  onlyMine: "Only me",
  onlyTheirs: "Only them",
};

const OVERLAP_CATEGORIES: OverlapCategory[] = [
  "both",
  "onlyMine",
  "onlyTheirs",
];

const isVisited = (entry: { status: TravelStatus } | undefined) =>
  entry?.status === "visited";

const DRILLDOWN_MAX = 8;

export const CompareView: React.FC<CompareViewProps> = ({
  theirEncoded,
  theirMapName,
  theirData,
}) => {
  const [countries] = useState<CountryFeature[]>(() => loadCountries());
  const [mine, setMine] = useState<TravelMapData>({
    countries: {},
    cities: {},
  });
  const [mineLoading, setMineLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve(localStorageStore.load()).then((data) => {
      if (cancelled) return;
      setMine(data);
      setMineLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const getCountryCategory = (countryCode: string): CountryOverlayCategory => {
    const m = isVisited(mine.countries[countryCode]);
    const t = isVisited(theirData.countries[countryCode]);
    if (m && t) return "both";
    if (m && !t) return "onlyMine";
    if (!m && t) return "onlyTheirs";
    return "neither";
  };

  const getCountryFill = (countryCode: string): string => {
    return CATEGORY_COLORS[getCountryCategory(countryCode)];
  };

  const countryStats = useMemo(() => {
    const result: Record<CountryOverlayCategory, number> = {
      both: 0,
      onlyMine: 0,
      onlyTheirs: 0,
      neither: 0,
    };
    const allCodes = new Set<string>([
      ...Object.keys(mine.countries),
      ...Object.keys(theirData.countries),
    ]);
    for (const code of allCodes) {
      const cat = getCountryCategory(code);
      if (cat !== "neither") result[cat]++;
    }
    return result;
  }, [mine, theirData]); // eslint-disable-line react-hooks/exhaustive-deps

  const cityOverlap = useMemo(
    () => computeCityOverlap(mine.cities, theirData.cities),
    [mine.cities, theirData.cities],
  );

  const uniqueCountriesToThem = useMemo(() => {
    return Object.entries(theirData.countries)
      .filter(
        ([code, entry]) =>
          entry.status === "visited" && !isVisited(mine.countries[code]),
      )
      .map(([code]) => code);
  }, [mine, theirData]);

  const selectedCountryName = useMemo(() => {
    if (!selectedCountry) return null;
    return (
      countries.find((c) => String(c.id) === selectedCountry)?.properties
        .name ?? selectedCountry
    );
  }, [selectedCountry, countries]);

  const drilldown = useMemo(() => {
    if (!selectedCountry) return null;
    const mineInCountry = citiesInCountry(mine.cities, selectedCountry);
    const theirsInCountry = citiesInCountry(theirData.cities, selectedCountry);
    const bothIds = new Set(
      mineInCountry
        .filter((c) => theirData.cities[c.cityId])
        .map((c) => c.cityId),
    );
    return { mineInCountry, theirsInCountry, bothIds };
  }, [selectedCountry, mine.cities, theirData.cities]);

  const handleCountryClick = (countryCode: string) => {
    setSelectedCountry((prev) => (prev === countryCode ? null : countryCode));
  };

  const handleImportTheirUniqueCountries = async () => {
    try {
      const toAdd: MapData = {};
      for (const code of uniqueCountriesToThem) {
        toAdd[code] = { countryCode: code, status: "want_to_visit" };
      }
      const merged = mergeMapData(mine.countries, toAdd, "keep-mine");
      const next = { ...mine, countries: merged };
      await Promise.resolve(localStorageStore.save(next));
      setMine(next);
      toast.success(
        `Added ${uniqueCountriesToThem.length} ${
          uniqueCountriesToThem.length === 1 ? "country" : "countries"
        } as "want to visit"`,
      );
    } catch {
      toast.error("Couldn't import. Please try again.");
    }
  };

  const handleImportTheirUniqueCities = async () => {
    const ids = cityOverlap.onlyTheirs.map((c) => c.cityId);
    if (ids.length === 0) return;
    try {
      const toImport: typeof theirData.cities = {};
      for (const c of cityOverlap.onlyTheirs) {
        toImport[c.cityId] = c;
      }
      const next = importTheirCities(mine, toImport, "planning");
      await Promise.resolve(localStorageStore.save(next));
      setMine(next);
      toast.success(
        `Added ${ids.length} ${ids.length === 1 ? "city" : "cities"} as planning`,
      );
    } catch {
      toast.error("Couldn't import cities. Please try again.");
    }
  };

  if (mineLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center">
        Loading your map…
      </div>
    );
  }

  const renderOverlapRows = (stats: Record<OverlapCategory, number>) =>
    OVERLAP_CATEGORIES.map((cat) => (
      <div key={cat} className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: CATEGORY_COLORS[cat] }}
          />
          <span className="text-muted-foreground text-sm">
            {CATEGORY_LABELS[cat]}
          </span>
        </div>
        <Badge variant="secondary">{stats[cat]}</Badge>
      </div>
    ));

  const renderCityListItem = (
    city: { cityId: string; name: string; status: TravelStatus },
    isBoth: boolean,
  ) => (
    <li key={city.cityId} className="flex items-center gap-2 text-sm">
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: STATUS_COLORS[city.status] }}
        aria-hidden
      />
      <span
        className={isBoth ? "text-foreground font-medium" : "text-foreground"}
      >
        {city.name}
        {isBoth && (
          <span className="text-muted-foreground ml-1 text-xs">· both</span>
        )}
      </span>
    </li>
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-3xl font-bold">
            Your map vs {theirMapName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Click a country to compare cities there.
          </p>
        </div>
        <Button asChild variant="ghost">
          <Link href={`/m/${theirEncoded}`} className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Back to {theirMapName}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card className="border-border bg-card p-4">
            <CardHeader className="pb-2">
              <h3 className="text-foreground text-lg font-semibold">
                Countries
              </h3>
              <p className="text-muted-foreground text-xs">
                Visited only · matches map colors
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {renderOverlapRows(countryStats)}
            </CardContent>
          </Card>

          {drilldown && selectedCountryName && (
            <Card className="border-border bg-card p-4">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <h3 className="text-foreground text-lg font-semibold">
                    Cities in {selectedCountryName}
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    Tap the country again on the map to deselect
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCountry(null)}
                  className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer transition-colors"
                  aria-label="Clear country selection"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
                    You
                  </p>
                  {drilldown.mineInCountry.length === 0 ? (
                    <p className="text-muted-foreground text-sm">None</p>
                  ) : (
                    <ul className="space-y-1">
                      {drilldown.mineInCountry
                        .slice(0, DRILLDOWN_MAX)
                        .map((city) =>
                          renderCityListItem(
                            city,
                            drilldown.bothIds.has(city.cityId),
                          ),
                        )}
                      {drilldown.mineInCountry.length > DRILLDOWN_MAX && (
                        <li className="text-muted-foreground text-xs">
                          +{drilldown.mineInCountry.length - DRILLDOWN_MAX} more
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
                    Their map
                  </p>
                  {drilldown.theirsInCountry.length === 0 ? (
                    <p className="text-muted-foreground text-sm">None</p>
                  ) : (
                    <ul className="space-y-1">
                      {drilldown.theirsInCountry
                        .slice(0, DRILLDOWN_MAX)
                        .map((city) =>
                          renderCityListItem(
                            city,
                            drilldown.bothIds.has(city.cityId),
                          ),
                        )}
                      {drilldown.theirsInCountry.length > DRILLDOWN_MAX && (
                        <li className="text-muted-foreground text-xs">
                          +{drilldown.theirsInCountry.length - DRILLDOWN_MAX}{" "}
                          more
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {uniqueCountriesToThem.length > 0 && (
            <Card className="border-border bg-card p-4">
              <CardHeader className="pb-2">
                <h3 className="text-foreground text-lg font-semibold">
                  Explore together
                </h3>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-muted-foreground text-sm">
                  Their map includes {uniqueCountriesToThem.length}{" "}
                  {uniqueCountriesToThem.length === 1 ? "country" : "countries"}{" "}
                  you haven&apos;t visited. Add them as want to visit?
                </p>
                <Button
                  variant="default"
                  className="w-full cursor-pointer"
                  onClick={handleImportTheirUniqueCountries}
                >
                  Add {uniqueCountriesToThem.length}{" "}
                  {uniqueCountriesToThem.length === 1 ? "country" : "countries"}
                </Button>
              </CardContent>
            </Card>
          )}

          {cityOverlap.onlyTheirs.length > 0 && (
            <Card className="border-border bg-card p-4">
              <CardHeader className="pb-2">
                <h3 className="text-foreground text-lg font-semibold">
                  Their cities
                </h3>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-muted-foreground text-sm">
                  Their map has {cityOverlap.onlyTheirs.length} stamped{" "}
                  {cityOverlap.onlyTheirs.length === 1 ? "city" : "cities"} you
                  don&apos;t. Add as planning?
                </p>
                <Button
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={handleImportTheirUniqueCities}
                >
                  Add {cityOverlap.onlyTheirs.length}{" "}
                  {cityOverlap.onlyTheirs.length === 1 ? "city" : "cities"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex items-center justify-center lg:col-span-3">
          <div className="border-border bg-card mx-auto flex w-full max-w-4xl items-center justify-center overflow-hidden rounded-lg border p-4 shadow-md">
            <div className="w-full">
              <MapView
                getCountryStatus={() => null}
                getCountryFill={(code) => getCountryFill(code)}
                onCountryClick={handleCountryClick}
                selectedCountry={selectedCountry}
                stampedCities={Object.values(theirData.cities)}
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
