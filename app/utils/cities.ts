import catalog from "@/public/cities/populated-places.json";
import { CityCatalogEntry, CityEntry, TravelStatus } from "../types";

export interface CityCatalog {
  meta: {
    source: string;
    sourceUrl: string;
    version: string;
    filter: string;
    generatedAt: string;
    count: number;
  };
  cities: CityCatalogEntry[];
}

let cached: CityCatalogEntry[] | null = null;
let byId: Map<string, CityCatalogEntry> | null = null;

export const loadCityCatalog = (): CityCatalogEntry[] => {
  if (cached) return cached;
  cached = (catalog as CityCatalog).cities;
  return cached;
};

export const getCityCatalogMeta = () => (catalog as CityCatalog).meta;

export const getCityById = (cityId: string): CityCatalogEntry | undefined => {
  if (!byId) {
    byId = new Map(loadCityCatalog().map((c) => [c.id, c]));
  }
  return byId.get(cityId);
};

export const getCitiesByCountry = (countryCode: string): CityCatalogEntry[] => {
  return loadCityCatalog().filter((c) => c.countryCode === countryCode);
};

export const normalizeSearch = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const searchCityCatalog = (
  query: string,
  limit = 8,
): CityCatalogEntry[] =>
  filterCityCatalogEntries(loadCityCatalog(), query, limit);

export const filterCityCatalogEntries = (
  cities: CityCatalogEntry[],
  query: string,
  limit = 50,
): CityCatalogEntry[] => {
  const q = normalizeSearch(query.trim());
  if (!q) return [];

  const prefix: CityCatalogEntry[] = [];
  const substring: CityCatalogEntry[] = [];

  for (const city of cities) {
    const name = normalizeSearch(city.name);
    if (name.startsWith(q)) {
      prefix.push(city);
    } else if (name.includes(q)) {
      substring.push(city);
    }
    if (prefix.length + substring.length >= limit * 3) break;
  }

  return [...prefix, ...substring].slice(0, limit);
};

export const catalogEntryToCityEntry = (
  entry: CityCatalogEntry,
  status: TravelStatus = "visited",
): Omit<CityEntry, "visitedAt" | "notes" | "stampedAt"> => ({
  cityId: entry.id,
  countryCode: entry.countryCode,
  name: entry.name,
  lat: entry.lat,
  lng: entry.lng,
  status,
});
