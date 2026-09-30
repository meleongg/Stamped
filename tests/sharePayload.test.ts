import { describe, expect, it } from "vitest";

import {
  canonicalSharePayload,
  hasShareableContent,
  parseSharePayloadBody,
  sanitizeShareName,
  stripForShare,
} from "@/app/utils/sharePayload";
import { isShareCacheFresh } from "@/app/utils/shareClient";

const privateMap = {
  countries: {
    "840": {
      countryCode: "840",
      status: "visited" as const,
      notes: "private country note",
      visitedAt: "2024-06-01",
    },
  },
  cities: {
    vancouver: {
      cityId: "vancouver",
      countryCode: "124",
      name: "Vancouver",
      lat: 49.2827,
      lng: -123.1207,
      status: "planning" as const,
      notes: "private city note",
      visitedAt: "2024-07-01",
      stampedAt: "2024-01-01T00:00:00.000Z",
    },
  },
};

describe("share payload privacy and canonicalization", () => {
  it("removes private notes and visit metadata from shares", () => {
    expect(stripForShare(privateMap)).toEqual({
      countries: { "840": { countryCode: "840", status: "visited" } },
      cities: {
        vancouver: {
          cityId: "vancouver",
          countryCode: "124",
          name: "Vancouver",
          lat: 49.2827,
          lng: -123.1207,
          status: "planning",
        },
      },
    });
  });

  it("normalizes names and sorts records for stable payloads", () => {
    const canonical = canonicalSharePayload({
      name: "  My\n\t map\u0000 ",
      data: {
        countries: {
          "840": privateMap.countries["840"],
          "124": { countryCode: "124", status: "planning" },
        },
        cities: privateMap.cities,
      },
    });

    expect(canonical.name).toBe("My map");
    expect(Object.keys(canonical.data.countries)).toEqual(["124", "840"]);
    expect(sanitizeShareName("x".repeat(41))).toHaveLength(40);
  });

  it("rejects empty or unshareable request bodies", () => {
    expect(() => parseSharePayloadBody({ name: "", data: privateMap })).toThrow(
      "Map name is required.",
    );
    expect(() =>
      parseSharePayloadBody({
        name: "Empty",
        data: { countries: {}, cities: {} },
      }),
    ).toThrow("Add at least one country or city before sharing.");
  });

  it("allows city-only share payloads", () => {
    expect(
      hasShareableContent({ countries: {}, cities: privateMap.cities }),
    ).toBe(true);
    const parsed = parseSharePayloadBody({
      name: "Cities",
      data: { countries: {}, cities: privateMap.cities },
    });
    expect(Object.keys(parsed.data.cities)).toEqual(["vancouver"]);
  });

  it("treats expired share cache timestamps as stale", () => {
    const now = Date.parse("2026-09-30T12:00:00.000Z");
    expect(isShareCacheFresh("2026-09-29T12:00:00.000Z", now)).toBe(false);
    expect(isShareCacheFresh("2026-10-01T12:00:00.000Z", now)).toBe(true);
    expect(isShareCacheFresh(undefined, now)).toBe(false);
  });
});
