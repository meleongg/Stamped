import { describe, expect, it } from "vitest";

import {
  buildReplayEvents,
  citiesAsOfReplay,
  countryStatusAsOfReplay,
  formatReplayCursorLabel,
  revealedEventIds,
  replayIntervalForSpeed,
} from "@/app/utils/replay";
import { TravelMapData } from "@/app/types";

const sampleMap = (): TravelMapData => ({
  countries: {
    "840": {
      countryCode: "840",
      status: "visited",
      visitedAt: "2024-06-01",
    },
    "124": {
      countryCode: "124",
      status: "visited",
    },
    "250": {
      countryCode: "250",
      status: "planning",
    },
  },
  cities: {
    yvr: {
      cityId: "yvr",
      countryCode: "124",
      name: "Vancouver",
      lat: 49.2,
      lng: -123.1,
      status: "visited",
      stampedAt: "2023-05-01T12:00:00.000Z",
    },
    nyc: {
      cityId: "nyc",
      countryCode: "840",
      name: "New York",
      lat: 40.7,
      lng: -74,
      status: "visited",
      visitedAt: "2024-07-01",
    },
  },
});

describe("replay timeline", () => {
  it("builds ascending dated events and excludes undated visits", () => {
    const events = buildReplayEvents(sampleMap());
    expect(events.map((event) => event.id)).toEqual([
      "city:yvr",
      "country:840",
      "city:nyc",
    ]);
    expect(events.every((event) => event.date)).toBe(true);
  });

  it("reveals events inclusively by scrub index", () => {
    const events = buildReplayEvents(sampleMap());
    expect(revealedEventIds(events, -1).size).toBe(0);
    expect([...revealedEventIds(events, 0)]).toEqual(["city:yvr"]);
    expect(revealedEventIds(events, 2).size).toBe(3);
  });

  it("hides unrevealed visited places while keeping planning visible", () => {
    const data = sampleMap();
    const events = buildReplayEvents(data);
    const revealed = revealedEventIds(events, 0);

    expect(countryStatusAsOfReplay(data, "840", revealed, true)).toBeNull();
    expect(countryStatusAsOfReplay(data, "250", revealed, true)).toBe(
      "planning",
    );
    expect(countryStatusAsOfReplay(data, "840", revealed, false)).toBe(
      "visited",
    );

    const cities = Object.values(data.cities);
    expect(citiesAsOfReplay(cities, revealed, true).map((c) => c.cityId)).toEqual([
      "yvr",
    ]);
  });

  it("formats cursor labels and speed intervals", () => {
    const events = buildReplayEvents(sampleMap());
    expect(formatReplayCursorLabel(events, -1)).toBe("Start");
    expect(formatReplayCursorLabel(events, 0)).toMatch(/2023|May/);
    expect(replayIntervalForSpeed(2)).toBeLessThan(replayIntervalForSpeed(1));
  });
});
