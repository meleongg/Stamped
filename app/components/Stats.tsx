"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Stats
        </h3>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              World visited
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {visitedPercent}%
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${Math.min(100, visitedPercent)}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {visitedCount} of {totalCountriesInWorld} countries
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Continents
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {continentsCount} / {totalContinents}
          </span>
        </div>
        {continentsCovered.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
            {continentsCovered.join(" · ")}
          </div>
        )}

        {yearLine && (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Visits
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {yearLine}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
