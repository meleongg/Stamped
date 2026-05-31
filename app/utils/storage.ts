import { STATUS_CYCLE, STORAGE_KEYS } from "../constants";
import { catalogEntryToCityEntry, getCityById } from "./cities";
import { countryCodesMatch } from "./countryCodes";
import {
  CityData,
  CityEntry,
  CountryEntry,
  MapData,
  TravelMapData,
  EMPTY_TRAVEL_MAP,
} from "../types";

/**
 * MapDataStore is the seam that decouples UI/hook code from the persistence
 * layer. Today we only ship a localStorage implementation; a future backend
 * (e.g. Supabase) can plug in here without touching components.
 */
export interface MapDataStore {
  load(): Promise<TravelMapData> | TravelMapData;
  save(data: TravelMapData): Promise<void> | void;
}

export const normalizeStoredData = (parsed: unknown): TravelMapData => {
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Partial<TravelMapData>;
    if ("countries" in obj || "cities" in obj) {
      return {
        countries: obj.countries ?? {},
        cities: obj.cities ?? {},
      };
    }
  }
  return EMPTY_TRAVEL_MAP;
};

export const localStorageStore: MapDataStore = {
  load(): TravelMapData {
    if (typeof window === "undefined") return EMPTY_TRAVEL_MAP;

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_MAP_DATA);
      if (!stored) return EMPTY_TRAVEL_MAP;

      return normalizeStoredData(JSON.parse(stored));
    } catch (error) {
      console.error("Error loading map data:", error);
      return EMPTY_TRAVEL_MAP;
    }
  },

  save(data: TravelMapData): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEYS.USER_MAP_DATA, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving map data:", error);
    }
  },
};

export const loadMapData = (): TravelMapData =>
  localStorageStore.load() as TravelMapData;

export const saveMapData = (data: TravelMapData): void => {
  void localStorageStore.save(data);
};

export const updateCountryEntry = (
  data: MapData,
  countryCode: string,
  updates: Partial<CountryEntry>,
): MapData => {
  const existing = data[countryCode];
  const updatedEntry: CountryEntry = {
    ...existing,
    countryCode,
    status: existing?.status || "visited",
    ...updates,
  };

  return {
    ...data,
    [countryCode]: updatedEntry,
  };
};

export const cycleCountryStatus = (
  data: MapData,
  countryCode: string,
): MapData => {
  const currentEntry = data[countryCode];

  if (!currentEntry || !currentEntry.status) {
    return updateCountryEntry(data, countryCode, { status: STATUS_CYCLE[0] });
  }

  const currentIndex = STATUS_CYCLE.indexOf(currentEntry.status);
  const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];

  return updateCountryEntry(data, countryCode, { status: nextStatus });
};

export const removeCountryEntry = (
  data: MapData,
  countryCode: string,
): MapData => {
  const newData = { ...data };
  delete newData[countryCode];
  return newData;
};

export const stampCityEntry = (
  data: TravelMapData,
  catalogId: string,
): TravelMapData => {
  const catalog = getCityById(catalogId);
  if (!catalog) return data;

  const existing = data.cities[catalogId];
  const countryStatus = Object.entries(data.countries).find(([code]) =>
    countryCodesMatch(code, catalog.countryCode),
  )?.[1]?.status;
  const defaultStatus = existing?.status ?? countryStatus ?? "visited";
  const entry: CityEntry = {
    ...catalogEntryToCityEntry(catalog, defaultStatus),
    stampedAt: existing?.stampedAt ?? new Date().toISOString(),
    visitedAt: existing?.visitedAt,
    notes: existing?.notes,
  };

  return {
    ...data,
    cities: { ...data.cities, [catalogId]: entry },
  };
};

export const updateCityEntry = (
  data: TravelMapData,
  cityId: string,
  updates: Partial<Pick<CityEntry, "status" | "visitedAt" | "notes">>,
): TravelMapData => {
  const existing = data.cities[cityId];
  if (!existing) return data;

  const next: CityEntry = { ...existing, ...updates };
  if (next.status !== "visited") {
    next.visitedAt = undefined;
  }

  return {
    ...data,
    cities: {
      ...data.cities,
      [cityId]: next,
    },
  };
};

export const cycleCityStatus = (
  data: TravelMapData,
  cityId: string,
): TravelMapData => {
  const existing = data.cities[cityId];
  if (!existing) return data;

  const currentIndex = STATUS_CYCLE.indexOf(existing.status);
  const nextStatus =
    currentIndex >= 0
      ? STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length]
      : STATUS_CYCLE[0];

  return updateCityEntry(data, cityId, { status: nextStatus });
};

export const unstampCityEntry = (
  data: TravelMapData,
  cityId: string,
): TravelMapData => {
  const cities = { ...data.cities };
  delete cities[cityId];
  return { ...data, cities };
};

/** Stamp their cities missing from mine, defaulting to planning. */
export const importTheirCities = (
  data: TravelMapData,
  theirCities: CityData,
  defaultStatus: TravelMapData["cities"][string]["status"] = "planning",
): TravelMapData => {
  let next = data;
  for (const cityId of Object.keys(theirCities)) {
    if (next.cities[cityId]) continue;
    next = stampCityEntry(next, cityId);
    if (defaultStatus !== "visited") {
      next = updateCityEntry(next, cityId, { status: defaultStatus });
    }
  }
  return next;
};

export const mergeMapData = (
  mine: MapData,
  theirs: MapData,
  strategy: "keep-mine" | "use-theirs" = "keep-mine",
): MapData => {
  const result: MapData = { ...mine };
  for (const [code, entry] of Object.entries(theirs)) {
    if (result[code] && strategy === "keep-mine") continue;
    result[code] = {
      ...result[code],
      countryCode: code,
      status: entry.status,
    };
  }
  return result;
};

export const mergeCityData = (
  mine: CityData,
  theirs: CityData,
  strategy: "keep-mine" | "use-theirs" = "keep-mine",
): CityData => {
  const result: CityData = { ...mine };
  for (const [cityId, entry] of Object.entries(theirs)) {
    if (result[cityId] && strategy === "keep-mine") continue;
    result[cityId] = { ...entry };
  }
  return result;
};

export const mergeTravelMapData = (
  mine: TravelMapData,
  theirs: TravelMapData,
  strategy: "keep-mine" | "use-theirs" = "keep-mine",
): TravelMapData => ({
  countries: mergeMapData(mine.countries, theirs.countries, strategy),
  cities: mergeCityData(mine.cities, theirs.cities, strategy),
});
