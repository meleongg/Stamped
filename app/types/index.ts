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
  /** From Natural Earth admin-0; used when the simplified map has no polygon. */
  countryName: string;
  lat: number;
  lng: number;
  scalerank: number;
  featurecla: string;
}

/** User-stamped city with travel status (independent of country status). */
export interface CityEntry {
  cityId: string;
  countryCode: string;
  name: string;
  lat: number;
  lng: number;
  status: TravelStatus;
  /** ISO timestamp when the city was first stamped (local only). */
  stampedAt?: string;
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
