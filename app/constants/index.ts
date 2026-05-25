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

export const STATUS_CYCLE: TravelStatus[] = [
  "visited",
  "planning",
  "want_to_visit",
  "avoid",
];

// MapView-specific colors.
// Dark-mode unvisited fill is now LIGHTER than the ocean background so
// landmasses pop out, instead of disappearing into the dark map container.
// hoverStrokeDark moved to blue-300 so it doesn't collide with the
// want_to_visit fill (both were blue-500 previously, making hover invisible).
export const MAPVIEW_COLORS = {
  unvisitedFill: "#e0e7ff", // Light blue for unvisited countries
  unvisitedFillDark: "#475569", // slate-600 — readable on slate-900 ocean
  hoverFill: "#cbd5e1", // Subtle gray-blue for hover
  hoverFillDark: "#64748b", // slate-500 — one step lighter than fill
  visitedHover: "#16a34a", // green-600
  planningHover: "#ca8a04", // yellow-600 (same hue as new base)
  wantToVisitHover: "#2563eb", // blue-600
  avoidHover: "#b91c1c", // red-700
  selectedStroke: "#1e293b", // Even darker for selected country
  selectedStrokeDark: "#f1f5f9", // Light stroke for dark mode
  borderStroke: "#334155", // Medium-dark for borders
  borderStrokeDark: "#94a3b8", // slate-400 — more visible between countries
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
