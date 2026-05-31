import { catalogEntryToCityEntry, getCityById } from "./cities";
import {
  CityData,
  CountryEntry,
  MapData,
  TravelMapData,
  EMPTY_TRAVEL_MAP,
} from "../types";

export const SHARE_FORMAT_VERSION = 2;
export const SHARE_NAME_MAX = 40;

const STATUS_TO_CHAR: Record<TravelStatus, string> = {
  visited: "v",
  planning: "p",
  want_to_visit: "w",
  avoid: "a",
};

type TravelStatus = CountryEntry["status"];

const CHAR_TO_STATUS: Record<string, TravelStatus> = Object.entries(
  STATUS_TO_CHAR,
).reduce(
  (acc, [status, char]) => {
    acc[char] = status as TravelStatus;
    return acc;
  },
  {} as Record<string, TravelStatus>,
);

export class InvalidShareLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidShareLinkError";
  }
}

export interface SharePayload {
  name: string;
  data: TravelMapData;
}

export interface DecodedShare extends SharePayload {
  version: number;
}

export const sanitizeName = (raw: string): string => {
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, SHARE_NAME_MAX);
};

export const isValidName = (raw: string): boolean => {
  const cleaned = sanitizeName(raw);
  return cleaned.length > 0;
};

const toBase64Url = (input: string): string => {
  const bytes =
    typeof Buffer !== "undefined"
      ? Buffer.from(input, "utf8")
      : new TextEncoder().encode(input);
  let b64: string;
  if (typeof Buffer !== "undefined" && bytes instanceof Buffer) {
    b64 = bytes.toString("base64");
  } else {
    let binary = "";
    (bytes as Uint8Array).forEach((b) => {
      binary += String.fromCharCode(b);
    });
    b64 = btoa(binary);
  }
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (input: string): string => {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "===".slice((b64.length + 3) % 4);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf8");
  }
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

const encodeCountries = (data: MapData): string => {
  return Object.values(data)
    .filter((entry): entry is CountryEntry => Boolean(entry?.countryCode))
    .map((entry) => `${entry.countryCode}${STATUS_TO_CHAR[entry.status]}`)
    .filter((token) => /^[A-Za-z0-9_-]+[vpwa]$/.test(token))
    .sort()
    .join(",");
};

const decodeCountries = (csv: string): MapData => {
  if (!csv) return {};
  const result: MapData = {};
  const tokens = csv.split(",");
  for (const raw of tokens) {
    const token = raw.trim();
    if (!token) continue;
    const statusChar = token.slice(-1);
    const code = token.slice(0, -1);
    const status = CHAR_TO_STATUS[statusChar];
    if (!status || !code || !/^[A-Za-z0-9_-]+$/.test(code)) {
      throw new InvalidShareLinkError(`Bad country token: "${token}"`);
    }
    result[code] = { countryCode: code, status };
  }
  return result;
};

const encodeCities = (cities: CityData): string => {
  return Object.keys(cities)
    .filter((id) => /^[A-Za-z0-9_-]+$/.test(id))
    .sort()
    .join(",");
};

const decodeCities = (csv: string): CityData => {
  if (!csv.trim()) return {};
  const result: CityData = {};
  for (const raw of csv.split(",")) {
    const cityId = raw.trim();
    if (!cityId) continue;
    if (!/^[A-Za-z0-9_-]+$/.test(cityId)) {
      throw new InvalidShareLinkError(`Bad city token: "${cityId}"`);
    }
    const catalog = getCityById(cityId);
    if (!catalog) continue;
    result[cityId] = { ...catalogEntryToCityEntry(catalog) };
  }
  return result;
};

export const encodeMap = (payload: SharePayload): string => {
  const name = sanitizeName(payload.name);
  if (!name) {
    throw new Error("Display name is required to generate a share link.");
  }
  const countriesCsv = encodeCountries(payload.data.countries);
  const citiesCsv = encodeCities(payload.data.cities);
  const lines = [String(SHARE_FORMAT_VERSION), name, countriesCsv];
  if (citiesCsv) lines.push(citiesCsv);
  return toBase64Url(lines.join("\n"));
};

export const decodeMap = (encoded: string): DecodedShare => {
  if (!encoded || typeof encoded !== "string") {
    throw new InvalidShareLinkError("Empty share data.");
  }

  let wire: string;
  try {
    wire = fromBase64Url(encoded);
  } catch {
    throw new InvalidShareLinkError("Share link is not valid base64.");
  }

  const lines = wire.split("\n");
  if (lines.length < 2) {
    throw new InvalidShareLinkError("Malformed share payload.");
  }

  const versionStr = lines[0];
  const version = Number(versionStr);
  if (!Number.isInteger(version) || version < 1 || version > 2) {
    throw new InvalidShareLinkError(
      `Unsupported share version: "${versionStr}".`,
    );
  }

  const name = sanitizeName(lines[1] ?? "");
  if (!name) {
    throw new InvalidShareLinkError("Share link is missing a display name.");
  }

  const countriesCsv = lines[2]?.trim() ?? "";
  const countries = decodeCountries(countriesCsv);

  let cities: CityData = {};
  if (version >= 2 && lines.length > 3) {
    cities = decodeCities(lines.slice(3).join("\n").trim());
  }

  return {
    version,
    name,
    data: { countries, cities },
  };
};

/** Legacy helper: countries-only MapData from TravelMapData */
export const toLegacyMapData = (data: TravelMapData): MapData => data.countries;

export const buildShareUrl = (
  origin: string,
  payload: SharePayload,
): string => {
  const encoded = encodeMap(payload);
  return `${origin.replace(/\/$/, "")}/m/${encoded}`;
};

export const buildCompareUrl = (origin: string, theirData: string): string => {
  return `${origin.replace(/\/$/, "")}/compare/${theirData}`;
};

export { EMPTY_TRAVEL_MAP };
