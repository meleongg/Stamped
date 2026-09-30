import { MAPVIEW_COLORS, STATUS_COLORS } from "@/app/constants";
import { TravelStatus } from "@/app/types";

/** Cap color for a country polygon on the globe. */
export const globeCountryCapColor = (
  status: TravelStatus | null | undefined,
  theme: "light" | "dark",
): string => {
  if (status && status in STATUS_COLORS) {
    return STATUS_COLORS[status];
  }
  return theme === "dark"
    ? MAPVIEW_COLORS.unvisitedFillDark
    : MAPVIEW_COLORS.unvisitedFill;
};

export const globeSideColor = (theme: "light" | "dark"): string =>
  theme === "dark" ? "rgba(15, 23, 42, 0.35)" : "rgba(71, 85, 105, 0.25)";

export const globeStrokeColor = (theme: "light" | "dark"): string =>
  theme === "dark"
    ? MAPVIEW_COLORS.borderStrokeDark
    : MAPVIEW_COLORS.borderStroke;

export const globeBackgroundColor = (theme: "light" | "dark"): string =>
  theme === "dark" ? MAPVIEW_COLORS.oceanDark : MAPVIEW_COLORS.oceanLight;

export const globeCityPointColor = (status: TravelStatus): string =>
  STATUS_COLORS[status];
