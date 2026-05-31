"use client";

import { CitySidebar } from "@/app/components/CitySidebar";
import { CountrySearch } from "@/app/components/CountrySearch";
import { useHowToUse } from "@/app/components/HowToUseProvider";
import { Legend } from "@/app/components/Legend";
import { MapView, MapViewHandle } from "@/app/components/MapView";
import { NoteSidebar } from "@/app/components/NoteSidebar";
import { ShareDialog } from "@/app/components/ShareDialog";
import { Stats } from "@/app/components/Stats";
import { useMapData } from "@/app/hooks/useMapData";
import { CityCatalogEntry, CityEntry } from "@/app/types";
import { countryCodesMatch } from "@/app/utils/countryCodes";
import { CountryFeature, loadCountries } from "@/app/utils/geo";
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
    target.closest('[data-slot="popover-content"]') !== null
  );
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

  const stats = useMemo(() => computeStats(travelMapData), [travelMapData]);

  const selectedStatus = selectedCountry
    ? getCountryStatus(selectedCountry)
    : null;

  const stampedCities = getStampedCities();

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
    if (selectedCountry === countryCode) {
      cycleStatus(countryCode);
    } else {
      setSelectedCountry(countryCode);
    }
  };

  const handleSearchSelectCountry = (countryCode: string) => {
    setSelectedCountry(countryCode);
    mapRef.current?.focusCountry(countryCode);
  };

  const handleSearchSelectCity = (city: CityCatalogEntry) => {
    if (!isCityStamped(city.id)) {
      stampCity(city.id);
      toast.success(`Stamped · ${city.name}`);
    }
    setSelectedCityId(city.id);
    mapRef.current?.focusCity(city.id, city.lat, city.lng);
  };

  const handleCityClick = (cityId: string) => {
    const city = getCityData(cityId);
    if (!city) return;
    if (selectedCityId === cityId) {
      cycleCity(cityId);
    } else {
      setSelectedCityId(cityId);
    }
    mapRef.current?.focusCity(cityId, city.lat, city.lng);
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

  const sidebarKey = selectedCountry
    ? `country-${selectedCountry}-${selectedStatus ?? "new"}`
    : "country-closed";

  const selectedCityStatus = selectedCityId
    ? getCityData(selectedCityId)?.status
    : null;

  const citySidebarKey = selectedCityId
    ? `city-${selectedCityId}-${selectedCityStatus ?? "new"}`
    : "city-closed";
  const selectedCityData = selectedCityId ? getCityData(selectedCityId) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Legend counts={getTotalCountsByStatus()} />
          <Stats stats={stats} />
        </div>
        <div id="map-workspace" className="flex flex-col gap-3 lg:col-span-3">
          <CountrySearch
            countries={countries}
            getCountryStatus={getCountryStatus}
            getCityStatus={(id) => getCityData(id)?.status ?? null}
            onSelectCountry={handleSearchSelectCountry}
            onSelectCity={handleSearchSelectCity}
          />
          <div className="border-border bg-card mx-auto flex w-full max-w-4xl items-center justify-center overflow-hidden rounded-lg border p-4 shadow-md">
            <div className="w-full">
              <MapView
                ref={mapRef}
                getCountryStatus={getCountryStatus}
                onCountryClick={handleCountryClick}
                selectedCountry={selectedCountry}
                hoveredCountry={hoveredCountry}
                onCountryHover={setHoveredCountry}
                stampedCities={stampedCities}
                selectedCityId={selectedCityId}
                onCityClick={handleCityClick}
                countries={countries}
                isLoading={false}
              />
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-4xl justify-center">
            <div className="w-full max-w-xs sm:max-w-sm">
              <ShareDialog travelMapData={travelMapData} />
            </div>
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
          stampCity(id);
          toast.success("City stamped");
        }}
        onUnstampCity={unstampCity}
      />
      <CitySidebar
        key={citySidebarKey}
        cityId={selectedCityId}
        cityData={selectedCityData}
        onUpdateCity={updateCity}
        onUnstampCity={unstampCity}
        onClose={() => setSelectedCityId(null)}
        isOpen={!!selectedCityId && !!selectedCityData}
      />
    </div>
  );
}
