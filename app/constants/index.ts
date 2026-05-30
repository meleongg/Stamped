// Travel status related constants.
// Yellow shifted from yellow-400 to yellow-500 (#eab308) for better contrast
// on both light and dark backgrounds — yellow-400 washes out on white and
// glares on dark.
export const STATUS_COLORS = {
  visited: "#22c55e", // green-500
  planning: "#eab308", // yellow-500
  want_to_visit: "#3b82f6", // blue-500
  avoid: "#ef4444", // red-500
} as const;

export const STATUS_LABELS = {
  visited: "Visited",
  planning: "Planning to Visit",
  want_to_visit: "Want to Visit",
  avoid: "Avoid",
} as const;

/** Statuses users can pick or cycle into in the editor UI. */
export const ACTIVE_STATUSES: TravelStatus[] = [
  "visited",
  "planning",
  "want_to_visit",
];

export const STATUS_CYCLE: TravelStatus[] = ACTIVE_STATUSES;

// MapView-specific colors.
// Light mode: medium slate land on sky-100 ocean (Ocean Travel palette).
// Unvisited paths use a 0.4px border so coastlines and neighbors stay visible.
// Dark mode: slate-600 land on slate-900 ocean; borders slate-400 for clearer edges.
export const MAPVIEW_COLORS = {
  oceanLight: "#e0f2fe", // sky-100 — water (light mode)
  oceanDark: "#0f172a", // slate-900 — water (dark mode)
  unvisitedFill: "#94a3b8", // slate-400 — unvisited land (light mode)
  unvisitedFillDark: "#475569", // slate-600 — unvisited land (dark mode)
  hoverFill: "#cbd5e1", // slate-300 — hover on unvisited land (light mode)
  hoverFillDark: "#64748b", // slate-500 — hover on unvisited land (dark mode)
  visitedHover: "#16a34a", // green-600
  planningHover: "#ca8a04", // yellow-600 (same hue as new base)
  wantToVisitHover: "#2563eb", // blue-600
  avoidHover: "#b91c1c", // red-700
  selectedStroke: "#1e293b", // selected country (light mode)
  selectedStrokeDark: "#f1f5f9", // selected country (dark mode)
  borderStroke: "#475569", // slate-600 — country edges (light mode)
  borderStrokeDark: "#94a3b8", // slate-400 — lighter edges on slate-600 land (dark mode)
  hoverStroke: "#1e40af", // Blue for hover
  hoverStrokeDark: "#93c5fd", // blue-300 — readable against all status fills
} as const;

// Map dimensions
export const MAP_DIMENSIONS = {
  WIDTH: 1000,
  HEIGHT: 600,
} as const;

// Storage keys
export const STORAGE_KEYS = {
  USER_MAP_DATA: "userMapData",
} as const;

// Import the TravelStatus type
import type { TravelStatus } from "../types";
