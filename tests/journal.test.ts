import { describe, expect, it } from "vitest";

import {
  buildJournalEntries,
  filterUndatedJournalEntries,
  formatJournalDateLabel,
  nextTravelStatus,
  resolveJournalDate,
  visitDateForToday,
} from "@/app/utils/journal";
import { formatDateString, parseDateString } from "@/app/utils/dates";
import {
  cycleCountryStatus,
  updateCountryEntry,
} from "@/app/utils/storage";

describe("date helpers", () => {
  it("round-trips local YYYY-MM-DD without timezone shift", () => {
    const raw = "2024-06-15";
    const date = parseDateString(raw);
    expect(date).toBeDefined();
    expect(formatDateString(date!)).toBe(raw);
  });
});

describe("journal chronology", () => {
  it("prefers visitedAt over stampedAt for display", () => {
    expect(
      resolveJournalDate("2024-06-01", "2023-01-01T00:00:00.000Z"),
    ).toEqual({ displayDate: "2024-06-01", dateSource: "visited" });
    expect(resolveJournalDate(undefined, "2023-01-01T00:00:00.000Z")).toEqual({
      displayDate: "2023-01-01",
      dateSource: "stamped",
    });
  });

  it("builds a newest-first visited journal with undated filter", () => {
    const entries = buildJournalEntries({
      countries: {
        "840": {
          countryCode: "840",
          status: "visited",
          visitedAt: "2024-01-01",
        },
        "124": {
          countryCode: "124",
          status: "visited",
        },
        "250": {
          countryCode: "250",
          status: "planning",
          visitedAt: "2020-01-01",
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
      },
    });

    expect(entries.map((e) => e.id)).toEqual([
      "country:840",
      "city:yvr",
      "country:124",
    ]);
    expect(entries[1].dateSource).toBe("stamped");
    expect(formatJournalDateLabel(entries[1])).toMatch(/^Stamped /);
    expect(filterUndatedJournalEntries(entries).map((e) => e.id)).toEqual([
      "city:yvr",
      "country:124",
    ]);
  });

  it("advances status the same way as the map cycle", () => {
    expect(nextTravelStatus(undefined)).toBe("visited");
    expect(nextTravelStatus("visited")).toBe("planning");
  });

  it("formats today as YYYY-MM-DD", () => {
    expect(visitDateForToday(new Date("2026-09-30T15:00:00"))).toBe(
      "2026-09-30",
    );
  });
});

describe("country visit-date hygiene", () => {
  it("clears a country visit date when status leaves visited", () => {
    const data = {
      "840": {
        countryCode: "840",
        status: "visited" as const,
        visitedAt: "2024-01-01",
      },
    };

    expect(
      updateCountryEntry(data, "840", { status: "planning" })["840"],
    ).toMatchObject({ status: "planning", visitedAt: undefined });

    const cycled = cycleCountryStatus(data, "840");
    expect(cycled["840"].status).toBe("planning");
    expect(cycled["840"].visitedAt).toBeUndefined();
  });
});
