import { STATUS_CYCLE } from "@/app/constants";
import { TravelMapData, TravelStatus } from "@/app/types";
import { getCountryNameByCode } from "@/app/utils/countryNames";
import {
  formatDateDisplay,
  isoTimestampToDateString,
  todayDateString,
} from "@/app/utils/dates";

export type JournalDateSource = "visited" | "stamped" | "none";

export interface JournalEntry {
  id: string;
  kind: "country" | "city";
  label: string;
  /** Country name for city rows. */
  subtitle?: string;
  countryCode: string;
  cityId?: string;
  visitedAt?: string;
  stampedAt?: string;
  /** YYYY-MM-DD used for sorting; null when no date at all. */
  displayDate: string | null;
  dateSource: JournalDateSource;
}

export const nextTravelStatus = (
  current: TravelStatus | undefined | null,
): TravelStatus => {
  if (!current) return STATUS_CYCLE[0];
  const index = STATUS_CYCLE.indexOf(current);
  if (index < 0) return STATUS_CYCLE[0];
  return STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length];
};

export const resolveJournalDate = (
  visitedAt: string | undefined,
  stampedAt: string | undefined,
): { displayDate: string | null; dateSource: JournalDateSource } => {
  if (visitedAt) {
    return { displayDate: visitedAt, dateSource: "visited" };
  }
  const fromStamp = isoTimestampToDateString(stampedAt);
  if (fromStamp) {
    return { displayDate: fromStamp, dateSource: "stamped" };
  }
  return { displayDate: null, dateSource: "none" };
};

/** Visited countries and cities for the author journal (local only). */
export const buildJournalEntries = (data: TravelMapData): JournalEntry[] => {
  const entries: JournalEntry[] = [];

  for (const entry of Object.values(data.countries)) {
    if (entry.status !== "visited") continue;
    const { displayDate, dateSource } = resolveJournalDate(
      entry.visitedAt,
      undefined,
    );
    entries.push({
      id: `country:${entry.countryCode}`,
      kind: "country",
      label: getCountryNameByCode(entry.countryCode),
      countryCode: entry.countryCode,
      visitedAt: entry.visitedAt,
      displayDate,
      dateSource,
    });
  }

  for (const entry of Object.values(data.cities)) {
    if (entry.status !== "visited") continue;
    const { displayDate, dateSource } = resolveJournalDate(
      entry.visitedAt,
      entry.stampedAt,
    );
    entries.push({
      id: `city:${entry.cityId}`,
      kind: "city",
      label: entry.name,
      subtitle: getCountryNameByCode(entry.countryCode),
      countryCode: entry.countryCode,
      cityId: entry.cityId,
      visitedAt: entry.visitedAt,
      stampedAt: entry.stampedAt,
      displayDate,
      dateSource,
    });
  }

  return sortJournalEntries(entries);
};

export const sortJournalEntries = (
  entries: JournalEntry[],
): JournalEntry[] => {
  return [...entries].sort((a, b) => {
    if (a.displayDate && b.displayDate) {
      const byDate = b.displayDate.localeCompare(a.displayDate);
      if (byDate !== 0) return byDate;
    } else if (a.displayDate) return -1;
    else if (b.displayDate) return 1;
    return a.label.localeCompare(b.label);
  });
};

/** Visited places missing an explicit visit date (stamp fallback does not count). */
export const filterUndatedJournalEntries = (
  entries: JournalEntry[],
): JournalEntry[] => entries.filter((entry) => !entry.visitedAt);

export const formatJournalDateLabel = (entry: JournalEntry): string => {
  if (entry.dateSource === "visited" && entry.displayDate) {
    return formatDateDisplay(entry.displayDate);
  }
  if (entry.dateSource === "stamped" && entry.displayDate) {
    return `Stamped ${formatDateDisplay(entry.displayDate)}`;
  }
  return "No visit date";
};

export const visitDateForToday = (now: Date = new Date()): string =>
  todayDateString(now);
