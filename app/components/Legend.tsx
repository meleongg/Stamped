"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ACTIVE_STATUSES, STATUS_COLORS, STATUS_LABELS } from "../constants";
import { TravelStatus } from "../types";

interface LegendProps {
  counts: Record<TravelStatus, number>;
}

export const Legend: React.FC<LegendProps> = ({ counts }) => {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="border-border bg-card gap-0 p-4 shadow-md">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg">Countries</CardTitle>
        <CardDescription className="text-xs">
          Map colors and counts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 px-0 pt-0">
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
                <span className="text-muted-foreground text-sm">
                  {STATUS_LABELS[status]}
                </span>
              </div>
              <Badge variant="secondary">{count}</Badge>
            </div>
          );
        })}
        {total > 0 && (
          <div className="border-border mt-4 flex items-center justify-between border-t pt-3">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Total stamped
            </span>
            <Badge variant="default" className="text-xs font-bold">
              {total}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
