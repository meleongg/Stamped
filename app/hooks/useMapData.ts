"use client";

import { useEffect, useState } from "react";
import { CountryEntry, MapData, TravelMapData } from "../types";
import {
  cycleCountryStatus,
  cycleCityStatus,
  localStorageStore,
  MapDataStore,
  removeCountryEntry,
  stampCityEntry,
  unstampCityEntry,
  updateCityEntry,
  updateCountryEntry,
} from "../utils/storage";

export interface UseMapDataOptions {
  store?: MapDataStore;
}

export const useMapData = ({
  store = localStorageStore,
}: UseMapDataOptions = {}) => {
  const [travelMapData, setTravelMapData] = useState<TravelMapData>({
    countries: {},
    cities: {},
  });
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(store.load()).then((data) => {
      if (cancelled) return;
      setTravelMapData(data);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  useEffect(() => {
    if (!isLoading) {
      void store.save(travelMapData);
    }
  }, [travelMapData, isLoading, store]);

  const mapData = travelMapData.countries;

  const updateCountry = (
    countryCode: string,
    updates: Partial<CountryEntry>,
  ) => {
    setTravelMapData((prev) => ({
      ...prev,
      countries: updateCountryEntry(prev.countries, countryCode, updates),
    }));
  };

  const cycleStatus = (countryCode: string) => {
    setTravelMapData((prev) => ({
      ...prev,
      countries: cycleCountryStatus(prev.countries, countryCode),
    }));
  };

  const removeCountry = (countryCode: string) => {
    setTravelMapData((prev) => ({
      ...prev,
      countries: removeCountryEntry(prev.countries, countryCode),
    }));
    if (selectedCountry === countryCode) {
      setSelectedCountry(null);
    }
  };

  const stampCity = (cityId: string) => {
    setTravelMapData((prev) => stampCityEntry(prev, cityId));
  };

  const cycleCity = (cityId: string) => {
    setTravelMapData((prev) => cycleCityStatus(prev, cityId));
  };

  const unstampCity = (cityId: string) => {
    setTravelMapData((prev) => unstampCityEntry(prev, cityId));
    if (selectedCityId === cityId) {
      setSelectedCityId(null);
    }
  };

  const updateCity = (
    cityId: string,
    updates: Partial<
      Pick<import("../types").CityEntry, "status" | "visitedAt" | "notes">
    >,
  ) => {
    setTravelMapData((prev) => updateCityEntry(prev, cityId, updates));
  };

  const replaceTravelMapData = (next: TravelMapData) => {
    setTravelMapData(next);
  };

  const getCountryData = (countryCode: string): CountryEntry | null => {
    return mapData[countryCode] || null;
  };

  const getCountryStatus = (countryCode: string) => {
    return mapData[countryCode]?.status || null;
  };

  const getCityData = (cityId: string) => {
    return travelMapData.cities[cityId] || null;
  };

  const isCityStamped = (cityId: string) =>
    Boolean(travelMapData.cities[cityId]);

  const getStampedCities = () => Object.values(travelMapData.cities);

  const getTotalCountsByStatus = () => {
    return Object.values(mapData).reduce(
      (acc, entry) => {
        acc[entry.status] = (acc[entry.status] || 0) + 1;
        return acc;
      },
      {} as Record<import("../types").TravelStatus, number>,
    );
  };

  const selectCountry = (countryCode: string | null) => {
    setSelectedCountry(countryCode);
    if (countryCode) setSelectedCityId(null);
  };

  const selectCity = (cityId: string | null) => {
    setSelectedCityId(cityId);
    if (cityId) setSelectedCountry(null);
  };

  return {
    travelMapData,
    mapData,
    selectedCountry,
    setSelectedCountry: selectCountry,
    selectedCityId,
    setSelectedCityId: selectCity,
    updateCountry,
    cycleStatus,
    removeCountry,
    stampCity,
    cycleCity,
    unstampCity,
    updateCity,
    replaceTravelMapData,
    getCountryData,
    getCountryStatus,
    getCityData,
    isCityStamped,
    getStampedCities,
    getTotalCountsByStatus,
    isLoading,
  };
};

// Back-compat alias
export type { MapData };
