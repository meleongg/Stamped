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

/** Whole days remaining until expiry (0 if expired or today). Display-only. */
export const shareExpiryDaysRemaining = (
  expiresAt: string,
  now: Date = new Date(),
): number => {
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return 0;
  const ms = end - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
};

/** e.g. "Expires March 30, 2026 · in 89 days" */
export const formatShareExpiryLabel = (
  expiresAt: string,
  now: Date = new Date(),
): string => {
  const date = formatShareExpiry(expiresAt);
  const days = shareExpiryDaysRemaining(expiresAt, now);
  if (days <= 0) return `Expired ${date}`;
  if (days === 1) return `Expires ${date} · tomorrow`;
  return `Expires ${date} · in ${days} days`;
};

export type ShareLinkErrorCode = "invalid_id" | "not_found" | "expired";

export interface ShareLinkErrorCopy {
  title: string;
  message: string;
  nextStep: string;
}

/** Friendly copy for expired / broken share pages (UI only). */
export const describeShareLinkError = (
  code: ShareLinkErrorCode | null | undefined,
): ShareLinkErrorCopy => {
  if (code === "expired") {
    return {
      title: "This share link has expired",
      message:
        "Shared maps stay available for 90 days of inactivity, then they retire automatically.",
      nextStep: "Ask the sender to open Share again and send you a fresh link.",
    };
  }
  if (code === "invalid_id") {
    return {
      title: "This share link looks incomplete",
      message:
        "The link may have been copied wrong, or part of it is missing.",
      nextStep: "Ask the sender to copy the link again from Share.",
    };
  }
  return {
    title: "This share link looks broken",
    message:
      "We couldn't find a map for this link. It may have expired, been mistyped, or never existed.",
    nextStep: "Ask the sender to share again, or start your own map.",
  };
};

export { EMPTY_TRAVEL_MAP } from "../types";
