import { STATUS_CYCLE, STORAGE_KEYS } from "../constants";
import { CountryEntry, MapData } from "../types";

/**
 * MapDataStore is the seam that decouples UI/hook code from the persistence
 * layer. Today we only ship a localStorage implementation; a future backend
 * (e.g. Supabase) can plug in here without touching components.
 */
export interface MapDataStore {
  load(): Promise<MapData> | MapData;
  save(data: MapData): Promise<void> | void;
}

const isLegacyArray = (parsed: unknown): parsed is CountryEntry[] =>
  Array.isArray(parsed);

const convertArrayToObject = (entries: CountryEntry[]): MapData => {
  return entries.reduce((acc, entry) => {
    acc[entry.countryCode] = entry;
    return acc;
  }, {} as MapData);
};

export const localStorageStore: MapDataStore = {
  load(): MapData {
    if (typeof window === "undefined") return {};

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_MAP_DATA);
      if (!stored) return {};

      const parsed = JSON.parse(stored);
      return isLegacyArray(parsed) ? convertArrayToObject(parsed) : parsed;
    } catch (error) {
      console.error("Error loading map data:", error);
      return {};
    }
  },

  save(data: MapData): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEYS.USER_MAP_DATA, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving map data:", error);
    }
  },
};

// Back-compat exports for any direct importers; prefer the store above.
export const loadMapData = (): MapData => localStorageStore.load() as MapData;
export const saveMapData = (data: MapData): void => {
  void localStorageStore.save(data);
};

export const updateCountryEntry = (
  data: MapData,
  countryCode: string,
  updates: Partial<CountryEntry>
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
  countryCode: string
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
  countryCode: string
): MapData => {
  const newData = { ...data };
  delete newData[countryCode];
  return newData;
};

/**
 * Merges `theirs` into `mine` using the chosen strategy:
 * - "keep-mine": existing entries in `mine` win on collisions
 * - "use-theirs": entries from `theirs` overwrite on collisions
 */
export const mergeMapData = (
  mine: MapData,
  theirs: MapData,
  strategy: "keep-mine" | "use-theirs" = "keep-mine"
): MapData => {
  const result: MapData = { ...mine };
  for (const [code, entry] of Object.entries(theirs)) {
    if (result[code] && strategy === "keep-mine") continue;
    // Never import notes/dates from a share link payload; only status.
    result[code] = {
      ...result[code],
      countryCode: code,
      status: entry.status,
    };
  }
  return result;
};
