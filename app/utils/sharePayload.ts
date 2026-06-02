import {
  CityData,
  CityEntry,
  CountryEntry,
  MapData,
  TravelMapData,
  TravelStatus,
} from "../types";

export const SHARE_NAME_MAX = 40;

export interface SharePayload {
  name: string;
  data: TravelMapData;
}

/** Strip private fields before storing or hashing share data. */
export const stripForShare = (data: TravelMapData): TravelMapData => {
  const countries: MapData = {};
  for (const entry of Object.values(data.countries)) {
    if (!entry?.countryCode || !entry.status) continue;
    countries[entry.countryCode] = {
      countryCode: entry.countryCode,
      status: entry.status,
    };
  }

  const cities: CityData = {};
  for (const entry of Object.values(data.cities)) {
    if (!entry?.cityId || !entry.status) continue;
    cities[entry.cityId] = {
      cityId: entry.cityId,
      countryCode: entry.countryCode,
      name: entry.name,
      lat: entry.lat,
      lng: entry.lng,
      status: entry.status,
    };
  }

  return { countries, cities };
};

const sortRecord = <T>(record: Record<string, T>): Record<string, T> =>
  Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => a.localeCompare(b)),
  );

export const sanitizeShareName = (raw: string): string => {
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, SHARE_NAME_MAX);
};

export const canonicalSharePayload = (payload: SharePayload): SharePayload => {
  const stripped = stripForShare(payload.data);
  return {
    name: sanitizeShareName(payload.name),
    data: {
      countries: sortRecord(stripped.countries),
      cities: sortRecord(stripped.cities),
    },
  };
};

export const isValidShareName = (raw: string): boolean =>
  sanitizeShareName(raw).length > 0;

export const hasShareableContent = (data: TravelMapData): boolean =>
  Object.keys(stripForShare(data).countries).length > 0;

const canonicalJson = (payload: SharePayload): string =>
  JSON.stringify(canonicalSharePayload(payload));

/** Stable SHA-256 hex digest for deduping create vs update on the client. */
export const hashSharePayload = async (
  payload: SharePayload,
): Promise<string> => {
  const json = canonicalJson(payload);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const bytes = new TextEncoder().encode(json);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  const { createHash } = await import("crypto");
  return createHash("sha256").update(json).digest("hex");
};

export const ACTIVE_SHARE_STATUSES: TravelStatus[] = [
  "visited",
  "planning",
  "want_to_visit",
  "avoid",
];

export const validateCountryEntry = (entry: unknown): entry is CountryEntry => {
  if (!entry || typeof entry !== "object") return false;
  const e = entry as CountryEntry;
  return (
    typeof e.countryCode === "string" &&
    e.countryCode.length > 0 &&
    ACTIVE_SHARE_STATUSES.includes(e.status)
  );
};

export const validateCityEntry = (entry: unknown): entry is CityEntry => {
  if (!entry || typeof entry !== "object") return false;
  const e = entry as CityEntry;
  return (
    typeof e.cityId === "string" &&
    e.cityId.length > 0 &&
    typeof e.name === "string" &&
    typeof e.countryCode === "string" &&
    typeof e.lat === "number" &&
    typeof e.lng === "number" &&
    ACTIVE_SHARE_STATUSES.includes(e.status)
  );
};

export const parseSharePayloadBody = (body: unknown): SharePayload => {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body.");
  }
  const { name, data } = body as SharePayload;
  if (typeof name !== "string" || !data || typeof data !== "object") {
    throw new Error("Invalid request body.");
  }
  const canonical = canonicalSharePayload({ name, data });
  if (!isValidShareName(canonical.name)) {
    throw new Error("Map name is required.");
  }
  if (!hasShareableContent(canonical.data)) {
    throw new Error("Add at least one country before sharing.");
  }
  for (const entry of Object.values(canonical.data.countries)) {
    if (!validateCountryEntry(entry)) {
      throw new Error("Invalid country entry.");
    }
  }
  for (const entry of Object.values(canonical.data.cities)) {
    if (!validateCityEntry(entry)) {
      throw new Error("Invalid city entry.");
    }
  }
  return canonical;
};
