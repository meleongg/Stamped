import { MAPVIEW_COLORS, STATUS_COLORS } from "@/app/constants";
import { CityEntry, TravelStatus } from "@/app/types";

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

/**
 * City chips use one high-contrast pair for both pin + label text, on an opaque
 * pill that sits above any country fill (works in light and dark mode).
 */
export const GLOBE_CITY_CHIP = {
  background: "rgba(15, 23, 42, 0.92)",
  foreground: "#f8fafc",
  border: "rgba(248, 250, 252, 0.35)",
  selectedBorder: "#f8fafc",
} as const;

/** Build a floating HTML chip so pin + name stay readable on any land color. */
export const createGlobeCityChip = (
  city: CityEntry,
  options: { selected?: boolean } = {},
): HTMLElement => {
  // Root is positioned by Three CSS2DRenderer (overwrites transform). Offset
  // lives on an inner wrapper so the nudge survives each frame.
  const root = document.createElement("div");
  root.style.pointerEvents = "none";
  root.style.userSelect = "none";
  root.setAttribute("aria-label", city.name);

  const chip = document.createElement("div");
  chip.style.display = "flex";
  chip.style.alignItems = "center";
  chip.style.gap = "6px";
  chip.style.padding = "4px 8px 4px 6px";
  chip.style.borderRadius = "999px";
  chip.style.background = GLOBE_CITY_CHIP.background;
  chip.style.color = GLOBE_CITY_CHIP.foreground;
  chip.style.border = `1px solid ${
    options.selected
      ? GLOBE_CITY_CHIP.selectedBorder
      : GLOBE_CITY_CHIP.border
  }`;
  chip.style.boxShadow = "0 4px 14px rgba(0, 0, 0, 0.35)";
  chip.style.fontFamily =
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";
  chip.style.fontSize = "11px";
  chip.style.fontWeight = "600";
  chip.style.lineHeight = "1";
  chip.style.whiteSpace = "nowrap";
  chip.style.transform = "translate(10px, -14px)";

  const pin = document.createElement("span");
  pin.style.display = "inline-block";
  pin.style.width = "8px";
  pin.style.height = "8px";
  pin.style.borderRadius = "999px";
  pin.style.flexShrink = "0";
  pin.style.background = GLOBE_CITY_CHIP.foreground;
  pin.style.boxShadow = `0 0 0 2px ${STATUS_COLORS[city.status]}`;

  const label = document.createElement("span");
  label.textContent = city.name;
  label.style.color = GLOBE_CITY_CHIP.foreground;

  chip.append(pin, label);
  root.append(chip);
  return root;
};
