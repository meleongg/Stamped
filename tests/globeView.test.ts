import { describe, expect, it } from "vitest";

import { STATUS_COLORS } from "@/app/constants";
import {
  createGlobeCityChip,
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

  it("builds a high-contrast city chip with matching pin and label color", () => {
    const chip = createGlobeCityChip({
      cityId: "yvr",
      countryCode: "124",
      name: "Vancouver",
      lat: 49.2,
      lng: -123.1,
      status: "visited",
    });

    expect(chip.style.background).toContain("15, 23, 42");
    expect(chip.textContent).toBe("Vancouver");
    const pin = chip.querySelector("span");
    const label = chip.querySelectorAll("span")[1];
    expect(pin?.style.background).toBe(GLOBE_CITY_CHIP.foreground);
    expect(label?.style.color).toBe(GLOBE_CITY_CHIP.foreground);
  });
});
