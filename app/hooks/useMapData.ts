"use client";

import { useEffect, useState } from "react";
import { CountryEntry, MapData, TravelStatus } from "../types";
import {
  cycleCountryStatus,
  localStorageStore,
  MapDataStore,
  removeCountryEntry,
  updateCountryEntry,
} from "../utils/storage";

export interface UseMapDataOptions {
  store?: MapDataStore;
}

export const useMapData = ({
  store = localStorageStore,
}: UseMapDataOptions = {}) => {
  const [mapData, setMapData] = useState<MapData>({});
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(store.load()).then((data) => {
      if (cancelled) return;
      setMapData(data);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  useEffect(() => {
    if (!isLoading) {
      void store.save(mapData);
    }
  }, [mapData, isLoading, store]);

  const updateCountry = (
    countryCode: string,
    updates: Partial<CountryEntry>
  ) => {
    setMapData((prev) => updateCountryEntry(prev, countryCode, updates));
  };

  const cycleStatus = (countryCode: string) => {
    setMapData((prev) => cycleCountryStatus(prev, countryCode));
  };

  const removeCountry = (countryCode: string) => {
    setMapData((prev) => removeCountryEntry(prev, countryCode));
    if (selectedCountry === countryCode) {
      setSelectedCountry(null);
    }
  };

  const replaceMapData = (next: MapData) => {
    setMapData(next);
  };

  const getCountryData = (countryCode: string): CountryEntry | null => {
    return mapData[countryCode] || null;
  };

  const getCountryStatus = (countryCode: string): TravelStatus | null => {
    return mapData[countryCode]?.status || null;
  };

  const getTotalCountsByStatus = () => {
    return Object.values(mapData).reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {} as Record<TravelStatus, number>);
  };

  return {
    mapData,
    selectedCountry,
    setSelectedCountry,
    updateCountry,
    cycleStatus,
    removeCountry,
    replaceMapData,
    getCountryData,
    getCountryStatus,
    getTotalCountsByStatus,
    isLoading,
  };
};
