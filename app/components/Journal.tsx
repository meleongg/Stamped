"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TravelMapData } from "@/app/types";
import {
  buildJournalEntries,
  filterUndatedJournalEntries,
  formatJournalDateLabel,
  JournalEntry,
  visitDateForToday,
} from "@/app/utils/journal";
import { useMemo, useState } from "react";

interface JournalProps {
  travelMapData: TravelMapData;
  onFocusCountry: (countryCode: string) => void;
  onFocusCity: (cityId: string) => void;
  onSetVisitDate: (
    target: { kind: "country"; countryCode: string } | { kind: "city"; cityId: string },
    visitedAt: string,
  ) => void;
}

export const Journal: React.FC<JournalProps> = ({
  travelMapData,
  onFocusCountry,
  onFocusCity,
  onSetVisitDate,
}) => {
  const [undatedOnly, setUndatedOnly] = useState(false);

  const allEntries = useMemo(
    () => buildJournalEntries(travelMapData),
    [travelMapData],
  );
  const undated = useMemo(
    () => filterUndatedJournalEntries(allEntries),
    [allEntries],
  );
  const entries = undatedOnly ? undated : allEntries;

  if (allEntries.length === 0) {
    return null;
  }

  const handleSelect = (entry: JournalEntry) => {
    if (entry.kind === "city" && entry.cityId) {
      onFocusCity(entry.cityId);
      return;
    }
    onFocusCountry(entry.countryCode);
  };

  const handleSetToday = (entry: JournalEntry) => {
    const today = visitDateForToday();
    if (entry.kind === "city" && entry.cityId) {
      onSetVisitDate({ kind: "city", cityId: entry.cityId }, today);
      return;
    }
    onSetVisitDate(
      { kind: "country", countryCode: entry.countryCode },
      today,
    );
  };

  const handleSetAllUndatedToday = () => {
    const today = visitDateForToday();
    for (const entry of undated) {
      if (entry.kind === "city" && entry.cityId) {
        onSetVisitDate({ kind: "city", cityId: entry.cityId }, today);
      } else {
        onSetVisitDate(
          { kind: "country", countryCode: entry.countryCode },
          today,
        );
      }
    }
  };

  return (
    <Card className="border-border bg-card gap-0 p-4 shadow-md">
      <CardHeader className="px-0 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Journal</CardTitle>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Visited places on this device only
            </p>
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {allEntries.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-0 pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={undatedOnly ? "default" : "outline"}
            className="h-7 cursor-pointer px-2 text-xs"
            onClick={() => setUndatedOnly((v) => !v)}
          >
            {undatedOnly ? "Showing undated" : "Undated only"}
            {undated.length > 0 ? ` (${undated.length})` : ""}
          </Button>
          {undated.length > 0 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 cursor-pointer px-2 text-xs"
              onClick={handleSetAllUndatedToday}
            >
              Set undated to today
            </Button>
          )}
        </div>

        <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {entries.length === 0 ? (
            <li className="text-muted-foreground text-xs">
              No undated visits — nice work.
            </li>
          ) : (
            entries.map((entry) => (
              <li key={entry.id}>
                <div className="hover:bg-accent/60 flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors">
                  <button
                    type="button"
                    className="min-w-0 flex-1 cursor-pointer text-left"
                    onClick={() => handleSelect(entry)}
                  >
                    <div className="text-foreground truncate text-sm font-medium">
                      {entry.label}
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      {entry.subtitle ? `${entry.subtitle} · ` : ""}
                      {formatJournalDateLabel(entry)}
                    </div>
                  </button>
                  {!entry.visitedAt && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 cursor-pointer px-2 text-xs"
                      onClick={() => handleSetToday(entry)}
                    >
                      Today
                    </Button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
};
