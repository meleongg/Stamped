export type TravelStatus = "visited" | "planning" | "want_to_visit" | "avoid";

export interface CountryEntry {
  countryCode: string; // ISO numeric string (world-atlas id)
  status: TravelStatus;
  notes?: string;
  visitedAt?: string; // ISO date string, optional
  colorOverride?: string; // Optional hex code
}

export interface MapData {
  [countryCode: string]: CountryEntry;
}

/** Catalog entry from Natural Earth Populated Places (bundled JSON). */
export interface CityCatalogEntry {
  id: string; // Natural Earth NE_ID
  name: string;
  countryCode: string;
  lat: number;
  lng: number;
  scalerank: number;
  featurecla: string;
}

/** User-stamped city (visited only in v2). */
export interface CityEntry {
  cityId: string;
  countryCode: string;
  name: string;
  lat: number;
  lng: number;
  visitedAt?: string;
  notes?: string;
}

export interface CityData {
  [cityId: string]: CityEntry;
}

export interface TravelMapData {
  countries: MapData;
  cities: CityData;
}

export const EMPTY_TRAVEL_MAP: TravelMapData = { countries: {}, cities: {} };
