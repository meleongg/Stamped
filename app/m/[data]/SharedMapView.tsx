"use client";

import { CountrySearch } from "@/app/components/CountrySearch";
import { Legend } from "@/app/components/Legend";
import { MapView, MapViewHandle } from "@/app/components/MapView";
import { Stats } from "@/app/components/Stats";
import { SharedMapActions } from "@/app/m/[data]/SharedMapActions";
import { CityCatalogEntry, TravelMapData, TravelStatus } from "@/app/types";
import { CountryFeature, loadCountries } from "@/app/utils/geo";
import { decodeMap } from "@/app/utils/share";
import { computeStats } from "@/app/utils/stats";
import { localStorageStore } from "@/app/utils/storage";
import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";

interface SharedMapViewProps {
  encoded: string;
  mapName: string;
}

const SharedMapActionStack: React.FC<{
  encoded: string;
  mapName: string;
  sharedData: TravelMapData;
  onImported: (merged: TravelMapData) => void;
  myData: TravelMapData;
}> = ({ encoded, mapName, sharedData, onImported, myData }) => (
  <SharedMapActions
    encoded={encoded}
    mapName={mapName}
    sharedData={sharedData}
    myData={myData}
    onImported={onImported}
  />
);

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
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const decoded = useMemo(() => decodeMap(encoded), [encoded]);
  const stats = useMemo(() => computeStats(decoded.data), [decoded.data]);

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

  const getCountryStatus = (countryCode: string): TravelStatus | null => {
    return decoded.data.countries[countryCode]?.status || null;
  };

  const counts = useMemo(() => {
    const acc = {
      visited: 0,
      planning: 0,
      want_to_visit: 0,
      avoid: 0,
    } satisfies Record<TravelStatus, number>;
    for (const entry of Object.values(decoded.data.countries)) {
      if (entry.status in acc) {
        acc[entry.status] += 1;
      }
    }
    return acc;
  }, [decoded.data]);

  const sharedCities = useMemo(
    () => Object.values(decoded.data.cities),
    [decoded.data.cities],
  );

  const getCityStatus = (cityId: string): TravelStatus | null =>
    decoded.data.cities[cityId]?.status ?? null;

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

  const actionStack = (
    <SharedMapActionStack
      encoded={encoded}
      mapName={mapName}
      sharedData={decoded.data}
      onImported={setMyData}
      myData={myData}
    />
  );

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
      <aside className="order-2 flex flex-col gap-6 lg:order-1 lg:col-span-1">
        <Legend counts={counts} />
        <Stats stats={stats} />
        <div className="hidden lg:block">{actionStack}</div>
      </aside>

      <div className="order-1 flex flex-col gap-3 lg:order-2 lg:col-span-3">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <CountrySearch
            countries={countries}
            getCountryStatus={getCountryStatus}
            getCityStatus={getCityStatus}
            onSelectCountry={handleSearchSelectCountry}
            onSelectCity={handleSearchSelectCity}
            placeholder={`Search countries & cities in ${mapName}…`}
          />
          <div className="border-border bg-card flex w-full items-center justify-center overflow-hidden rounded-lg border p-4 shadow-md">
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

        <div className="lg:hidden">{actionStack}</div>
      </div>
    </div>
  );
};
