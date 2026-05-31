import {
  Continent,
  CONTINENTS,
  TOTAL_CONTINENTS,
  getContinent,
} from "../constants/continents";
import { CountryEntry, MapData, TravelMapData, TravelStatus } from "../types";

export interface MapStats {
  totalCountriesInWorld: number;
  totalMarked: number;
  byStatus: Record<TravelStatus, number>;
  visitedCount: number;
  visitedPercent: number;
  continentsCovered: Continent[];
  continentsCount: number;
  totalContinents: number;
  firstVisitYear: number | null;
  latestVisitYear: number | null;
  citiesMarkedCount: number;
  citiesByStatus: Record<TravelStatus, number>;
}

export const TOTAL_COUNTRIES_IN_WORLD = 195;

const isStatus = (s: unknown): s is TravelStatus =>
  s === "visited" || s === "planning" || s === "want_to_visit" || s === "avoid";

const emptyStatusCounts = (): Record<TravelStatus, number> => ({
  visited: 0,
  planning: 0,
  want_to_visit: 0,
  avoid: 0,
});

const parseYear = (entry: CountryEntry): number | null => {
  if (!entry.visitedAt) return null;
  const year = Number(entry.visitedAt.slice(0, 4));
  return Number.isFinite(year) && year > 1900 && year < 2200 ? year : null;
};

export const computeStats = (data: MapData | TravelMapData): MapStats => {
  const countries = "countries" in data ? data.countries : (data as MapData);
  const cities = "cities" in data ? data.cities : {};
  const byStatus = emptyStatusCounts();
  const citiesByStatus = emptyStatusCounts();

  const visitedContinents = new Set<Continent>();
  let firstVisitYear: number | null = null;
  let latestVisitYear: number | null = null;

  for (const entry of Object.values(countries)) {
    const status = entry.status;
    if (!isStatus(status)) continue;
    byStatus[status] += 1;

    if (status === "visited") {
      const continent = getContinent(entry.countryCode);
      if (continent !== "Other") visitedContinents.add(continent);

      const year = parseYear(entry);
      if (year !== null) {
        if (firstVisitYear === null || year < firstVisitYear) {
          firstVisitYear = year;
        }
        if (latestVisitYear === null || year > latestVisitYear) {
          latestVisitYear = year;
        }
      }
    }
  }

  for (const entry of Object.values(cities)) {
    const status = entry.status;
    if (!isStatus(status)) continue;
    citiesByStatus[status] += 1;
  }

  const visitedCount = byStatus.visited;
  const visitedPercent = Math.round(
    (visitedCount / TOTAL_COUNTRIES_IN_WORLD) * 100,
  );

  const continentsCovered = CONTINENTS.filter((c) => visitedContinents.has(c));
  const citiesMarkedCount = Object.keys(cities).length;

  return {
    totalCountriesInWorld: TOTAL_COUNTRIES_IN_WORLD,
    totalMarked: Object.keys(countries).length,
    byStatus,
    visitedCount,
    visitedPercent,
    continentsCovered,
    continentsCount: continentsCovered.length,
    totalContinents: TOTAL_CONTINENTS,
    firstVisitYear,
    latestVisitYear,
    citiesMarkedCount,
    citiesByStatus,
  };
};
