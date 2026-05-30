"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapStats } from "@/app/utils/stats";

interface StatsProps {
  stats: MapStats;
}

export const Stats: React.FC<StatsProps> = ({ stats }) => {
  const {
    visitedCount,
    totalCountriesInWorld,
    visitedPercent,
    continentsCount,
    totalContinents,
    continentsCovered,
    firstVisitYear,
    latestVisitYear,
  } = stats;

  if (stats.totalMarked === 0) {
    return null;
  }

  const yearLine =
    firstVisitYear !== null && latestVisitYear !== null
      ? firstVisitYear === latestVisitYear
        ? `Visits in ${firstVisitYear}`
        : `${firstVisitYear} – ${latestVisitYear}`
      : null;

  return (
    <Card className="border-border bg-card gap-0 p-4 shadow-md">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg">Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-0 pt-0">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">World visited</span>
            <span className="text-foreground text-sm font-semibold">
              {visitedPercent}%
            </span>
          </div>
          <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${Math.min(100, visitedPercent)}%` }}
            />
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            {visitedCount} of {totalCountriesInWorld} countries
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground text-sm">Continents</span>
          <span className="text-foreground text-sm font-semibold">
            {continentsCount} / {totalContinents}
          </span>
        </div>
        {continentsCovered.length > 0 && (
          <div className="text-muted-foreground -mt-2 text-xs">
            {continentsCovered.join(" · ")}
          </div>
        )}

        {yearLine && (
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Visits</span>
            <span className="text-foreground text-sm font-semibold">
              {yearLine}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
