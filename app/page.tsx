"use client";

import { useMemo, useRef, useState } from "react";
import { CountrySearch } from "@/app/components/CountrySearch";
import { Legend } from "@/app/components/Legend";
import { MapView, MapViewHandle } from "@/app/components/MapView";
import { NoteSidebar } from "@/app/components/NoteSidebar";
import { ShareDialog } from "@/app/components/ShareDialog";
import { Stats } from "@/app/components/Stats";
import { useMapData } from "@/app/hooks/useMapData";
import { CountryFeature, loadCountries } from "@/app/utils/geo";
import { computeStats } from "@/app/utils/stats";

export default function Home() {
  const [countries] = useState<CountryFeature[]>(() => loadCountries());
  const mapRef = useRef<MapViewHandle>(null);

  const {
    mapData,
    selectedCountry,
    setSelectedCountry,
    updateCountry,
    cycleStatus,
    removeCountry,
    getCountryData,
    getCountryStatus,
    getTotalCountsByStatus,
    isLoading,
  } = useMapData();

  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const stats = useMemo(() => computeStats(mapData), [mapData]);

  const handleCountryHover = (countryCode: string | null) => {
    setHoveredCountry(countryCode);
  };

  const handleCountryClick = (countryCode: string) => {
    if (selectedCountry === countryCode) {
      cycleStatus(countryCode);
    } else {
      setSelectedCountry(countryCode);
    }
  };

  const handleSearchSelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    mapRef.current?.focusCountry(countryCode);
  };

  const handleCloseSidebar = () => {
    setSelectedCountry(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-xl text-gray-600 dark:text-gray-300">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  const selectedCountryName = selectedCountry
    ? countries.find((c: CountryFeature) => String(c.id) === selectedCountry)
        ?.properties.name || selectedCountry.toUpperCase()
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Legend counts={getTotalCountsByStatus()} />
          <Stats stats={stats} />
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">
              How to Use
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Tap or search for a country to select it</li>
              <li>• Click again to cycle through statuses</li>
              <li>• Add notes and visit dates in the sidebar</li>
              <li>• Your map is automatically saved in your browser</li>
              <li>• Use the Share button to send a link to a friend</li>
            </ul>
          </div>
          <ShareDialog mapData={mapData} />
        </div>
        <div className="flex flex-col gap-3 lg:col-span-3">
          <CountrySearch
            countries={countries}
            getCountryStatus={getCountryStatus}
            onSelect={handleSearchSelect}
          />
          <div className="mx-auto flex w-full max-w-4xl items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
            <div className="w-full">
              <MapView
                ref={mapRef}
                getCountryStatus={getCountryStatus}
                onCountryClick={handleCountryClick}
                selectedCountry={selectedCountry}
                hoveredCountry={hoveredCountry}
                onCountryHover={handleCountryHover}
                countries={countries}
                isLoading={false}
              />
            </div>
          </div>
        </div>
      </div>
      <NoteSidebar
        key={selectedCountry ?? "none"}
        countryCode={selectedCountry}
        countryName={selectedCountryName}
        countryData={selectedCountry ? getCountryData(selectedCountry) : null}
        onUpdateCountry={updateCountry}
        onRemoveCountry={removeCountry}
        onClose={handleCloseSidebar}
        isOpen={!!selectedCountry}
      />
    </div>
  );
}
