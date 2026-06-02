export { SHARE_NAME_MAX } from "@/app/utils/sharePayload";
export type { SharePayload } from "@/app/utils/sharePayload";

export class ShareLinkError extends Error {
  constructor(
    message: string,
    readonly code: "invalid_id" | "not_found" | "expired" = "not_found",
  ) {
    super(message);
    this.name = "ShareLinkError";
  }
}

/** @deprecated Use ShareLinkError — kept for imports during migration */
export class InvalidShareLinkError extends ShareLinkError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidShareLinkError";
  }
}

export const sanitizeName = (raw: string): string => {
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 40);
};

export const isValidName = (raw: string): boolean =>
  sanitizeName(raw).length > 0;

export const formatSharedMapHeading = (mapName: string): string => mapName;

export const formatSharedMapPageTitle = (mapName: string): string =>
  `${mapName} · Stamped`;

export const formatShareNativeTitle = (mapName: string): string => mapName;

export const formatShareNativeText = (mapName: string): string =>
  `Check out "${mapName}" on Stamped`;

export const buildShareUrl = (origin: string, shareId: string): string =>
  `${origin.replace(/\/$/, "")}/m/${shareId}`;

export const buildCompareUrl = (origin: string, shareId: string): string =>
  `${origin.replace(/\/$/, "")}/compare/${shareId}`;

export const formatShareExpiry = (expiresAt: string): string =>
  new Date(expiresAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export { EMPTY_TRAVEL_MAP } from "../types";
