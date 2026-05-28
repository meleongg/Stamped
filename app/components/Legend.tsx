"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ACTIVE_STATUSES, STATUS_COLORS, STATUS_LABELS } from "../constants";
import { TravelStatus } from "../types";

interface LegendProps {
  counts: Record<TravelStatus, number>;
}

export const Legend: React.FC<LegendProps> = ({ counts }) => {
  return (
    <Card className="border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Legend
        </h3>
      </CardHeader>
      <CardContent className="space-y-2">
        {ACTIVE_STATUSES.map((status) => {
          const color = STATUS_COLORS[status];
          const count = counts[status] || 0;
          return (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {STATUS_LABELS[status]}
                </span>
              </div>
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              >
                {count}
              </Badge>
            </div>
          );
        })}
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-600">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Countries
          </span>
          <Badge variant="default" className="text-xs font-bold">
            {Object.values(counts).reduce((sum, count) => sum + count, 0)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
