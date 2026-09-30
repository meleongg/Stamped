import { CityEntry, TravelMapData, TravelStatus } from "@/app/types";
import { formatDateDisplay } from "@/app/utils/dates";
import {
  buildJournalEntries,
  JournalEntry,
} from "@/app/utils/journal";

export interface ReplayEvent {
  id: string;
  kind: "country" | "city";
  countryCode: string;
  cityId?: string;
  label: string;
  /** YYYY-MM-DD chronological key */
  date: string;
  dateSource: "visited" | "stamped";
}

/**
 * Build an ascending timeline of dated visited places.
 * Undated visits are excluded (set dates in Journal to include them).
 */
export const buildReplayEvents = (data: TravelMapData): ReplayEvent[] => {
  const dated = buildJournalEntries(data).filter(
    (entry): entry is JournalEntry & { displayDate: string } =>
      Boolean(entry.displayDate) && entry.dateSource !== "none",
  );

  return dated
    .map((entry): ReplayEvent => ({
      id: entry.id,
      kind: entry.kind,
      countryCode: entry.countryCode,
      cityId: entry.cityId,
      label: entry.label,
      date: entry.displayDate,
      dateSource: entry.dateSource === "stamped" ? "stamped" : "visited",
    }))
    .sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate !== 0) return byDate;
      return a.label.localeCompare(b.label);
    });
};

/** Events at or before the scrubber index (inclusive). Index -1 = none revealed. */
export const revealedEventIds = (
  events: ReplayEvent[],
  scrubIndex: number,
): Set<string> => {
  if (scrubIndex < 0 || events.length === 0) return new Set();
  const end = Math.min(scrubIndex, events.length - 1);
  return new Set(events.slice(0, end + 1).map((event) => event.id));
};

export const formatReplayCursorLabel = (
  events: ReplayEvent[],
  scrubIndex: number,
): string => {
  if (events.length === 0) return "No dated visits yet";
  if (scrubIndex < 0) return "Start";
  const event = events[Math.min(scrubIndex, events.length - 1)];
  const source =
    event.dateSource === "stamped" ? " · stamped date" : "";
  return `${formatDateDisplay(event.date)}${source}`;
};

/**
 * During replay, visited places appear only once revealed.
 * Non-visited statuses (planning, etc.) stay visible as context.
 */
export const countryStatusAsOfReplay = (
  data: TravelMapData,
  countryCode: string,
  revealed: Set<string>,
  active: boolean,
): TravelStatus | null => {
  const entry = data.countries[countryCode];
  if (!entry) return null;
  if (!active || entry.status !== "visited") return entry.status;
  return revealed.has(`country:${countryCode}`) ? entry.status : null;
};

export const citiesAsOfReplay = (
  cities: CityEntry[],
  revealed: Set<string>,
  active: boolean,
): CityEntry[] => {
  if (!active) return cities;
  return cities.filter((city) => {
    if (city.status !== "visited") return true;
    return revealed.has(`city:${city.cityId}`);
  });
};

/** Default play interval ms for 1x speed (advance one event). */
export const REPLAY_BASE_INTERVAL_MS = 900;

export const replayIntervalForSpeed = (speed: number): number => {
  const safe = speed > 0 ? speed : 1;
  return Math.max(150, Math.round(REPLAY_BASE_INTERVAL_MS / safe));
};
