"use client";

import { ACTIVE_STATUSES, STATUS_COLORS, STATUS_LABELS } from "@/app/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapStats } from "@/app/utils/stats";

interface StatsProps {
  stats: MapStats;
}

const StatSection: React.FC<{
  title: string;
  total?: number | string;
  children?: React.ReactNode;
}> = ({ title, total, children }) => (
  <div>
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </span>
      {total !== undefined && (
        <span className="text-foreground text-sm font-semibold tabular-nums">
          {total}
        </span>
      )}
    </div>
    {children}
  </div>
);

const StatDetailRow: React.FC<{
  label: React.ReactNode;
  value?: number;
}> = ({ label, value }) => (
  <div className="border-border flex items-center justify-between gap-3 border-l-2 pl-3">
    <span className="text-muted-foreground text-xs">{label}</span>
    {value !== undefined && (
      <span className="text-muted-foreground text-xs font-medium tabular-nums">
        {value}
      </span>
    )}
  </div>
);

const StatSubheading: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    className="text-muted-foreground mt-2 mb-1 text-[10px] font-medium tracking-wide uppercase"
    role="presentation"
  >
    {children}
  </div>
);

export const Stats: React.FC<StatsProps> = ({ stats }) => {
  const {
    continentsCovered,
    firstVisitYear,
    latestVisitYear,
    citiesMarkedCount,
    citiesByStatus,
    citiesByContinent,
  } = stats;

  if (stats.totalMarked === 0 && citiesMarkedCount === 0) {
    return null;
  }

  const yearLine =
    firstVisitYear !== null && latestVisitYear !== null
      ? firstVisitYear === latestVisitYear
        ? String(firstVisitYear)
        : `${firstVisitYear} – ${latestVisitYear}`
      : null;

  const hasGeography =
    continentsCovered.length > 0 || yearLine || citiesMarkedCount > 0;

  if (!hasGeography) {
    return null;
  }

  const hasCityStatusBreakdown = ACTIVE_STATUSES.some(
    (s) => (citiesByStatus[s] ?? 0) > 0,
  );

  return (
    <Card className="border-border bg-card gap-0 p-4 shadow-md">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg">Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0 pt-0">
        {continentsCovered.length > 0 && (
          <StatSection title="Continents" total={continentsCovered.length}>
            <div className="mt-1.5 space-y-1">
              {continentsCovered.map((continent) => (
                <StatDetailRow key={continent} label={continent} />
              ))}
            </div>
          </StatSection>
        )}

        {yearLine && <StatSection title="Visits" total={yearLine} />}

        {citiesMarkedCount > 0 && (
          <StatSection title="Marked cities" total={citiesMarkedCount}>
            {hasCityStatusBreakdown && (
              <>
                <StatSubheading>By status</StatSubheading>
                <ul className="space-y-1">
                  {ACTIVE_STATUSES.map((status) => {
                    const count = citiesByStatus[status];
                    if (count === 0) return null;
                    return (
                      <li key={status}>
                        <StatDetailRow
                          label={
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block h-2 w-2 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: STATUS_COLORS[status],
                                }}
                                aria-hidden
                              />
                              {STATUS_LABELS[status]}
                            </span>
                          }
                          value={count}
                        />
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {citiesByContinent.length > 0 && (
              <>
                <StatSubheading>By continent</StatSubheading>
                <ul className="space-y-1">
                  {citiesByContinent.map(({ continent, count }) => (
                    <li key={continent}>
                      <StatDetailRow label={continent} value={count} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </StatSection>
        )}
      </CardContent>
    </Card>
  );
};
