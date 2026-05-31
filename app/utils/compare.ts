import { CityData, CityEntry } from "../types";

export type OverlapCategory = "both" | "onlyMine" | "onlyTheirs";

export interface CityOverlapResult {
  stats: Record<OverlapCategory, number>;
  onlyTheirs: CityEntry[];
  onlyMine: CityEntry[];
  both: CityEntry[];
}

export const computeCityOverlap = (
  mine: CityData,
  theirs: CityData,
): CityOverlapResult => {
  const mineIds = new Set(Object.keys(mine));
  const theirsIds = new Set(Object.keys(theirs));

  const onlyTheirs: CityEntry[] = [];
  const onlyMine: CityEntry[] = [];
  const both: CityEntry[] = [];

  for (const id of theirsIds) {
    const entry = theirs[id];
    if (!entry) continue;
    if (mineIds.has(id)) {
      both.push(entry);
    } else {
      onlyTheirs.push(entry);
    }
  }

  for (const id of mineIds) {
    const entry = mine[id];
    if (!entry || theirsIds.has(id)) continue;
    onlyMine.push(entry);
  }

  onlyTheirs.sort((a, b) => a.name.localeCompare(b.name));
  onlyMine.sort((a, b) => a.name.localeCompare(b.name));
  both.sort((a, b) => a.name.localeCompare(b.name));

  return {
    stats: {
      both: both.length,
      onlyMine: onlyMine.length,
      onlyTheirs: onlyTheirs.length,
    },
    onlyTheirs,
    onlyMine,
    both,
  };
};

export const citiesInCountry = (
  cities: CityData | CityEntry[],
  countryCode: string,
): CityEntry[] => {
  const entries = Array.isArray(cities) ? cities : Object.values(cities);
  return entries
    .filter((c) => c.countryCode === countryCode)
    .sort((a, b) => a.name.localeCompare(b.name));
};
