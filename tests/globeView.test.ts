import { describe, expect, it } from "vitest";

import { STATUS_COLORS } from "@/app/constants";
import {
  GLOBE_CITY_CHIP,
  globeCountryCapColor,
} from "@/app/utils/globeColors";
import {
  DEFAULT_MAP_VIEW_MODE,
  isMapViewMode,
} from "@/app/utils/mapViewMode";

describe("map view mode", () => {
  it("accepts only flat or globe", () => {
    expect(isMapViewMode("flat")).toBe(true);
    expect(isMapViewMode("globe")).toBe(true);
    expect(isMapViewMode("map")).toBe(false);
    expect(DEFAULT_MAP_VIEW_MODE).toBe("flat");
  });
});

describe("globe colors", () => {
  it("uses status colors when a status is present", () => {
    expect(globeCountryCapColor("visited", "light")).toBe(STATUS_COLORS.visited);
  });

  it("falls back to unvisited land colors by theme", () => {
    expect(globeCountryCapColor(null, "light")).toBe("#94a3b8");
    expect(globeCountryCapColor(undefined, "dark")).toBe("#475569");
  });

  it("defines a single high-contrast chip palette for pin and label", () => {
    expect(GLOBE_CITY_CHIP.foreground).toBe("#f8fafc");
    expect(GLOBE_CITY_CHIP.background).toContain("15, 23, 42");
    expect(GLOBE_CITY_CHIP.foreground).not.toBe(STATUS_COLORS.visited);
  });
});
