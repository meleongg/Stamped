import {
  Continent,
  CONTINENTS,
  TOTAL_CONTINENTS,
  getContinent,
} from "../constants/continents";
import { CountryEntry, MapData, TravelStatus } from "../types";

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
}

// Approximate number of sovereign countries; matches what most users expect
// to see as "the denominator" (close to UN member count). The world-atlas
// 110m topojson contains ~177 features, but we use the more recognizable 195
// figure so percentages line up with what people remember.
export const TOTAL_COUNTRIES_IN_WORLD = 195;

const isStatus = (s: unknown): s is TravelStatus =>
  s === "visited" || s === "planning" || s === "want_to_visit" || s === "avoid";

const parseYear = (entry: CountryEntry): number | null => {
  if (!entry.visitedAt) return null;
  // ISO date string "YYYY-MM-DD" — we just want the year.
  const year = Number(entry.visitedAt.slice(0, 4));
  return Number.isFinite(year) && year > 1900 && year < 2200 ? year : null;
};

export const computeStats = (data: MapData): MapStats => {
  const byStatus: Record<TravelStatus, number> = {
    visited: 0,
    planning: 0,
    want_to_visit: 0,
    avoid: 0,
  };

  const visitedContinents = new Set<Continent>();
  let firstVisitYear: number | null = null;
  let latestVisitYear: number | null = null;

  for (const entry of Object.values(data)) {
    if (!isStatus(entry.status)) continue;
    byStatus[entry.status] += 1;

    if (entry.status === "visited") {
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

  const visitedCount = byStatus.visited;
  const visitedPercent = Math.round(
    (visitedCount / TOTAL_COUNTRIES_IN_WORLD) * 100,
  );

  const continentsCovered = CONTINENTS.filter((c) => visitedContinents.has(c));

  return {
    totalCountriesInWorld: TOTAL_COUNTRIES_IN_WORLD,
    totalMarked: Object.keys(data).length,
    byStatus,
    visitedCount,
    visitedPercent,
    continentsCovered,
    continentsCount: continentsCovered.length,
    totalContinents: TOTAL_CONTINENTS,
    firstVisitYear,
    latestVisitYear,
  };
};
