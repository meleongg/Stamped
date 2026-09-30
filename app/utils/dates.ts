/**
 * Local calendar-date helpers (YYYY-MM-DD in the viewer's timezone).
 */

/** Parse a YYYY-MM-DD string into a local-time Date (no timezone surprises). */
export const parseDateString = (value: string): Date | undefined => {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

/** Format a Date back into a YYYY-MM-DD string in local time. */
export const formatDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const formatDateDisplay = (value: string): string => {
  const date = parseDateString(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/** Today's date as YYYY-MM-DD in local time. */
export const todayDateString = (now: Date = new Date()): string =>
  formatDateString(now);

/** Prefer the calendar date portion of an ISO timestamp. */
export const isoTimestampToDateString = (
  iso: string | undefined,
): string | undefined => {
  if (!iso) return undefined;
  const day = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined;
};
