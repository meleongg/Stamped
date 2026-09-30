"use client";

import { CitySidebar } from "@/app/components/CitySidebar";
import { CountrySearch } from "@/app/components/CountrySearch";
import { GlobeView } from "@/app/components/GlobeView";
import { useHowToUse } from "@/app/components/HowToUseProvider";
import { Journal } from "@/app/components/Journal";
import { Legend } from "@/app/components/Legend";
import { MapView, MapViewHandle } from "@/app/components/MapView";
import { MapViewToggle } from "@/app/components/MapViewToggle";
import { NoteSidebar } from "@/app/components/NoteSidebar";
import { ReplayControls } from "@/app/components/ReplayControls";
import { ShareDialog } from "@/app/components/ShareDialog";
import { Stats } from "@/app/components/Stats";
import { useMapData } from "@/app/hooks/useMapData";
import { useMapViewMode } from "@/app/hooks/useMapViewMode";
import { CityCatalogEntry, CityEntry, TravelStatus } from "@/app/types";
import { countryCodesMatch } from "@/app/utils/countryCodes";
import { getCountryNameByCode } from "@/app/utils/countryNames";
import { getCityById } from "@/app/utils/cities";
import { CountryFeature, loadCountries } from "@/app/utils/geo";
import {
  buildJournalEntries,
  filterUndatedJournalEntries,
  nextTravelStatus,
  visitDateForToday,
} from "@/app/utils/journal";
import {
  buildReplayEvents,
  citiesAsOfReplay,
  countryStatusAsOfReplay,
  revealedEventIds,
} from "@/app/utils/replay";
import { computeStats } from "@/app/utils/stats";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const compareCitiesByStampOrder = (a: CityEntry, b: CityEntry): number => {
  if (a.stampedAt && b.stampedAt) return a.stampedAt.localeCompare(b.stampedAt);
  if (a.stampedAt) return -1;
  if (b.stampedAt) return 1;
  return a.name.localeCompare(b.name);
};

/** Radix popovers portal outside the sidebar; treat them as in-sidebar clicks. */
const isSidebarInteraction = (target: Node): boolean => {
  if (!(target instanceof Element)) return false;
  return (
    document.getElementById("note-sidebar")?.contains(target) ||
    document.getElementById("city-sidebar")?.contains(target) ||
    document.getElementById("map-workspace")?.contains(target) ||
    document.getElementById("map-sidebar-rail")?.contains(target) ||
    target.closest('[data-slot="popover-content"]') !== null
  );
};

const VISIT_DATE_TOAST_MS = 8000;

const promptMissingVisitDate = (
  placeName: string,
  onUseToday: () => void,
  options?: { stamped?: boolean },
): void => {
  const title = options?.stamped
    ? `Stamped · ${placeName}`
    : `Add a visit date for ${placeName}?`;
  const description = options?.stamped
    ? "Add a visit date? Optional — builds your journal."
    : "Optional — builds your journal. Skip anytime.";
  const action = {
    label: "Use today",
    onClick: onUseToday,
  };
  if (options?.stamped) {
    toast.success(title, {
      description,
      action,
      duration: VISIT_DATE_TOAST_MS,
    });
    return;
  }
  toast.message(title, {
    description,
    action,
    duration: VISIT_DATE_TOAST_MS,
  });
};

const stampCityWithFeedback = (
  city: { id: string; name: string; countryCode: string },
  deps: {
    stampCity: (id: string) => void;
    getCountryStatus: (code: string) => TravelStatus | null;
    updateCity: (
      id: string,
      updates: Partial<Pick<CityEntry, "visitedAt">>,
    ) => void;
  },
): void => {
  deps.stampCity(city.id);
  const countryStatus = deps.getCountryStatus(city.countryCode);
  const willBeVisited =
    countryStatus === "visited" || countryStatus === null;
  if (willBeVisited) {
    promptMissingVisitDate(
      city.name,
      () => {
        deps.updateCity(city.id, { visitedAt: visitDateForToday() });
      },
      { stamped: true },
    );
    return;
  }
  toast.success(`Stamped · ${city.name}`);
};

export default function Home() {
  const [countries] = useState<CountryFeature[]>(() => loadCountries());
  const mapRef = useRef<MapViewHandle>(null);

  const {
    travelMapData,
    selectedCountry,
    setSelectedCountry,
    selectedCityId,
    setSelectedCityId,
    updateCountry,
    cycleStatus,
    removeCountry,
    stampCity,
    cycleCity,
    unstampCity,
    updateCity,
    getCountryData,
    getCountryStatus,
    getCityData,
    isCityStamped,
    getStampedCities,
    getTotalCountsByStatus,
    isLoading,
  } = useMapData();

  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const { openHelp, hasDismissedHelp } = useHowToUse();
  const autoOpenedHelpRef = useRef(false);
  const [replayActive, setReplayActive] = useState(false);
  const [replayScrubIndex, setReplayScrubIndex] = useState(-1);
  const { mode: mapViewMode, setMode: setMapViewMode } = useMapViewMode();
  const isGlobe = mapViewMode === "globe";

  const stats = useMemo(() => computeStats(travelMapData), [travelMapData]);

  const replayEvents = useMemo(
    () => buildReplayEvents(travelMapData),
    [travelMapData],
  );
  const undatedVisitCount = useMemo(
    () => filterUndatedJournalEntries(buildJournalEntries(travelMapData)).length,
    [travelMapData],
  );
  const revealedIds = useMemo(
    () => revealedEventIds(replayEvents, replayScrubIndex),
    [replayEvents, replayScrubIndex],
  );

  const getDisplayCountryStatus = (countryCode: string): TravelStatus | null =>
    countryStatusAsOfReplay(
      travelMapData,
      countryCode,
      revealedIds,
      replayActive,
    );

  const stampedCities = getStampedCities();

  const displayStampedCities = useMemo(
    () => citiesAsOfReplay(stampedCities, revealedIds, replayActive),
    [stampedCities, revealedIds, replayActive],
  );

  const stampedCitiesInCountry = useMemo(() => {
    if (!selectedCountry) return [];
    return stampedCities
      .filter((c) => countryCodesMatch(c.countryCode, selectedCountry))
      .sort(compareCitiesByStampOrder);
  }, [selectedCountry, stampedCities]);

  useEffect(() => {
    if (!selectedCountry && !selectedCityId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCountry(null);
        setSelectedCityId(null);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (isSidebarInteraction(e.target as Node)) return;
      setSelectedCountry(null);
      setSelectedCityId(null);
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [selectedCountry, selectedCityId, setSelectedCountry, setSelectedCityId]);

  useEffect(() => {
    if (isLoading || autoOpenedHelpRef.current) return;

    const isEmpty =
      Object.keys(travelMapData.countries).length === 0 &&
      Object.keys(travelMapData.cities).length === 0;

    if (isEmpty && !hasDismissedHelp()) {
      autoOpenedHelpRef.current = true;
      openHelp();
    }
  }, [isLoading, travelMapData, hasDismissedHelp, openHelp]);

  const handleCountryClick = (countryCode: string) => {
    if (replayActive) return;
    if (selectedCountry === countryCode) {
      const before = getCountryData(countryCode);
      const next = nextTravelStatus(before?.status);
      cycleStatus(countryCode);
      if (next === "visited" && !before?.visitedAt) {
        const name = getCountryNameByCode(countryCode);
        promptMissingVisitDate(name, () => {
          updateCountry(countryCode, { visitedAt: visitDateForToday() });
        });
      }
    } else {
      setSelectedCountry(countryCode);
    }
  };

  const handleSearchSelectCountry = (countryCode: string) => {
    setSelectedCountry(countryCode);
    if (!isGlobe) {
      mapRef.current?.focusCountry(countryCode);
    }
  };

  const handleSearchSelectCity = (city: CityCatalogEntry) => {
    if (replayActive) return;
    if (!isCityStamped(city.id)) {
      stampCityWithFeedback(city, {
        stampCity,
        getCountryStatus,
        updateCity,
      });
    }
    setSelectedCityId(city.id);
    if (!isGlobe) {
      mapRef.current?.focusCity(city.id, city.lat, city.lng);
    }
  };

  const handleCityClick = (cityId: string) => {
    if (replayActive) return;
    const city = getCityData(cityId);
    if (!city) return;
    if (selectedCityId === cityId) {
      const next = nextTravelStatus(city.status);
      cycleCity(cityId);
      if (next === "visited" && !city.visitedAt) {
        promptMissingVisitDate(city.name, () => {
          updateCity(cityId, { visitedAt: visitDateForToday() });
        });
      }
    } else {
      setSelectedCityId(cityId);
    }
    mapRef.current?.focusCity(cityId, city.lat, city.lng);
  };

  const handleJournalFocusCountry = (countryCode: string) => {
    setSelectedCityId(null);
    setSelectedCountry(countryCode);
    if (!isGlobe) {
      mapRef.current?.focusCountry(countryCode);
    }
  };

  const handleJournalFocusCity = (cityId: string) => {
    const city = getCityData(cityId);
    if (!city) return;
    setSelectedCountry(null);
    setSelectedCityId(cityId);
    if (!isGlobe) {
      mapRef.current?.focusCity(cityId, city.lat, city.lng);
    }
  };

  const handleJournalSetVisitDate = (
    target:
      | { kind: "country"; countryCode: string }
      | { kind: "city"; cityId: string },
    visitedAt: string,
  ) => {
    if (replayActive) return;
    if (target.kind === "city") {
      updateCity(target.cityId, { visitedAt });
      return;
    }
    updateCountry(target.countryCode, { visitedAt });
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  const selectedCountryName = selectedCountry
    ? countries.find((c: CountryFeature) => String(c.id) === selectedCountry)
        ?.properties.name || selectedCountry.toUpperCase()
    : null;

  // Key only on selection identity — including status remounts and drops draft notes.
  const sidebarKey = selectedCountry
    ? `country-${selectedCountry}`
    : "country-closed";

  const citySidebarKey = selectedCityId
    ? `city-${selectedCityId}`
    : "city-closed";
  const selectedCityData = selectedCityId ? getCityData(selectedCityId) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
        <div
          id="map-sidebar-rail"
          className="flex flex-col gap-6 lg:col-span-1"
        >
          <Legend counts={getTotalCountsByStatus()} />
          <Stats stats={stats} />
          <Journal
            travelMapData={travelMapData}
            onFocusCountry={handleJournalFocusCountry}
            onFocusCity={handleJournalFocusCity}
            onSetVisitDate={handleJournalSetVisitDate}
            readonly={replayActive}
          />
        </div>
        <div id="map-workspace" className="flex flex-col gap-3 lg:col-span-3">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <CountrySearch
                countries={countries}
                getCountryStatus={getCountryStatus}
                getCityStatus={(id) => getCityData(id)?.status ?? null}
                onSelectCountry={handleSearchSelectCountry}
                onSelectCity={handleSearchSelectCity}
                disabled={replayActive}
              />
            </div>
            <MapViewToggle mode={mapViewMode} onModeChange={setMapViewMode} />
          </div>
          <div className="border-border bg-card mx-auto flex w-full max-w-4xl items-center justify-center overflow-hidden rounded-lg border p-4 shadow-md">
            <div className="w-full">
              {isGlobe ? (
                <GlobeView
                  getCountryStatus={getDisplayCountryStatus}
                  stampedCities={displayStampedCities}
                  countries={countries}
                  selectedCountry={selectedCountry}
                  selectedCityId={selectedCityId}
                />
              ) : (
                <MapView
                  ref={mapRef}
                  getCountryStatus={getDisplayCountryStatus}
                  onCountryClick={handleCountryClick}
                  selectedCountry={selectedCountry}
                  hoveredCountry={hoveredCountry}
                  onCountryHover={setHoveredCountry}
                  stampedCities={displayStampedCities}
                  selectedCityId={selectedCityId}
                  onCityClick={handleCityClick}
                  countries={countries}
                  isLoading={false}
                  readonly={replayActive}
                />
              )}
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-4xl justify-center">
            <div className="w-full max-w-xs sm:max-w-sm">
              <ShareDialog travelMapData={travelMapData} />
            </div>
          </div>
          <div className="mx-auto w-full max-w-4xl">
            <ReplayControls
              events={replayEvents}
              undatedCount={undatedVisitCount}
              active={replayActive}
              onActiveChange={setReplayActive}
              scrubIndex={replayScrubIndex}
              onScrubIndexChange={setReplayScrubIndex}
            />
          </div>
        </div>
      </div>
      <NoteSidebar
        key={sidebarKey}
        countryCode={selectedCountry}
        countryName={selectedCountryName}
        countryData={selectedCountry ? getCountryData(selectedCountry) : null}
        onUpdateCountry={updateCountry}
        onRemoveCountry={removeCountry}
        onClose={() => setSelectedCountry(null)}
        isOpen={!!selectedCountry}
        stampedCities={stampedCitiesInCountry}
        onStampCity={(id) => {
          if (replayActive || !selectedCountry) return;
          const catalog = getCityById(id);
          stampCityWithFeedback(
            {
              id,
              name: catalog?.name ?? id,
              countryCode: catalog?.countryCode ?? selectedCountry,
            },
            {
              stampCity,
              getCountryStatus,
              updateCity,
            },
          );
        }}
        onUnstampCity={unstampCity}
        readonly={replayActive}
      />
      <CitySidebar
        key={citySidebarKey}
        cityId={selectedCityId}
        cityData={selectedCityData}
        onUpdateCity={updateCity}
        onUnstampCity={unstampCity}
        onClose={() => setSelectedCityId(null)}
        isOpen={!!selectedCityId && !!selectedCityData}
        readonly={replayActive}
      />
    </div>
  );
}
