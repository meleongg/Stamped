"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const mapRef = useRef<MapViewHandle>(null);

  useEffect(() => {
    setCountries(loadCountries());
    setIsMapLoading(false);
  }, []);

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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl text-gray-600 dark:text-gray-300">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  const selectedCountryName = selectedCountry
    ? countries.find(
        (c: CountryFeature) => String(c.id) === selectedCountry,
      )?.properties.name || selectedCountry.toUpperCase()
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Legend counts={getTotalCountsByStatus()} />
          <Stats stats={stats} />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
              How to Use
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <li>• Tap or search for a country to select it</li>
              <li>• Click again to cycle through statuses</li>
              <li>• Add notes and visit dates in the sidebar</li>
              <li>• Your map is automatically saved in your browser</li>
              <li>• Use the Share button to send a link to a friend</li>
            </ul>
          </div>
          <ShareDialog mapData={mapData} />
        </div>
        <div className="lg:col-span-3 flex flex-col gap-3">
          <CountrySearch
            countries={countries}
            getCountryStatus={getCountryStatus}
            onSelect={handleSearchSelect}
          />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 w-full max-w-4xl mx-auto overflow-hidden flex items-center justify-center">
            <div className="w-full">
              <MapView
                ref={mapRef}
                getCountryStatus={getCountryStatus}
                onCountryClick={handleCountryClick}
                selectedCountry={selectedCountry}
                hoveredCountry={hoveredCountry}
                onCountryHover={handleCountryHover}
                countries={countries}
                isLoading={isMapLoading}
              />
            </div>
          </div>
        </div>
      </div>
      <NoteSidebar
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
