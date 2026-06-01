import { Continent, CONTINENTS, getContinent } from "../constants/continents";
import { CountryEntry, MapData, TravelMapData, TravelStatus } from "../types";

export interface MapStats {
  totalMarked: number;
  byStatus: Record<TravelStatus, number>;
  visitedCount: number;
  continentsCovered: Continent[];
  continentsCount: number;
  firstVisitYear: number | null;
  latestVisitYear: number | null;
  citiesMarkedCount: number;
  citiesByStatus: Record<TravelStatus, number>;
  /** Stamped cities grouped by continent, highest count first. */
  citiesByContinent: Array<{ continent: Continent; count: number }>;
}

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

  const citiesByContinentMap = new Map<Continent, number>();
  for (const entry of Object.values(cities)) {
    const continent = getContinent(entry.countryCode);
    if (continent === "Other") continue;
    citiesByContinentMap.set(
      continent,
      (citiesByContinentMap.get(continent) ?? 0) + 1,
    );
  }

  const citiesByContinent = [...citiesByContinentMap.entries()]
    .map(([continent, count]) => ({ continent, count }))
    .sort(
      (a, b) => b.count - a.count || a.continent.localeCompare(b.continent),
    );

  const visitedCount = byStatus.visited;

  const continentsCovered = CONTINENTS.filter((c) => visitedContinents.has(c));
  const citiesMarkedCount = Object.keys(cities).length;

  return {
    totalMarked: Object.keys(countries).length,
    byStatus,
    visitedCount,
    continentsCovered,
    continentsCount: continentsCovered.length,
    firstVisitYear,
    latestVisitYear,
    citiesMarkedCount,
    citiesByStatus,
    citiesByContinent,
  };
};
