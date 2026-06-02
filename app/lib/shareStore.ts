import { randomBytes } from "crypto";
import { getReadRedis, getWriteRedis } from "./redis";
import { ShareLinkError } from "../utils/share";
import {
  canonicalSharePayload,
  SharePayload,
  stripForShare,
} from "../utils/sharePayload";

export const SHARE_TTL_SECONDS = 90 * 24 * 60 * 60;
export const SHARE_ID_LENGTH = 7;
export const SHARE_ID_PATTERN = /^[0-9A-Za-z]{7}$/;

const SHARE_KEY_PREFIX = "share:";
const CREATE_RATE_PREFIX = "ratelimit:share:create:";
const CREATE_RATE_LIMIT = 10;
const CREATE_RATE_WINDOW_SECONDS = 60 * 60;

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export class ShareStoreError extends Error {
  constructor(
    message: string,
    readonly code:
      | "invalid_id"
      | "not_found"
      | "expired"
      | "unauthorized"
      | "rate_limited",
  ) {
    super(message);
    this.name = "ShareStoreError";
  }
}

export interface StoredShare extends SharePayload {
  editToken: string;
  createdAt: string;
  expiresAt: string;
}

export interface PublicShare extends SharePayload {
  id: string;
  createdAt: string;
  expiresAt: string;
}

export interface CreateShareResult {
  id: string;
  editToken: string;
  url: string;
  expiresAt: string;
}

export interface UpdateShareResult {
  id: string;
  url: string;
  expiresAt: string;
}

export const isValidShareId = (id: string): boolean =>
  SHARE_ID_PATTERN.test(id);

const shareKey = (id: string): string => `${SHARE_KEY_PREFIX}${id}`;

const randomShareId = (): string => {
  const bytes = randomBytes(SHARE_ID_LENGTH);
  let id = "";
  for (let i = 0; i < SHARE_ID_LENGTH; i++) {
    id += BASE62[bytes[i] % BASE62.length];
  }
  return id;
};

const nowIso = (): string => new Date().toISOString();

const expiresAtFromNow = (): string =>
  new Date(Date.now() + SHARE_TTL_SECONDS * 1000).toISOString();

export const checkCreateRateLimit = async (clientIp: string): Promise<void> => {
  const redis = getWriteRedis();
  const key = `${CREATE_RATE_PREFIX}${clientIp || "unknown"}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, CREATE_RATE_WINDOW_SECONDS);
  }
  if (count > CREATE_RATE_LIMIT) {
    throw new ShareStoreError(
      "Too many share links created. Try again later.",
      "rate_limited",
    );
  }
};

const loadStoredShare = async (id: string): Promise<StoredShare | null> => {
  if (!isValidShareId(id)) return null;
  const redis = getReadRedis();
  const record = await redis.get<StoredShare>(shareKey(id));
  if (!record) return null;
  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    return null;
  }
  return record;
};

export const getPublicShare = async (
  id: string,
): Promise<PublicShare | null> => {
  const record = await loadStoredShare(id);
  if (!record) return null;
  return {
    id,
    name: record.name,
    data: stripForShare(record.data),
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  };
};

export const createShare = async (
  payload: SharePayload,
  origin: string,
): Promise<CreateShareResult> => {
  const canonical = canonicalSharePayload(payload);
  const redis = getWriteRedis();
  const editToken = randomBytes(32).toString("hex");
  const createdAt = nowIso();
  const expiresAt = expiresAtFromNow();

  for (let attempt = 0; attempt < 5; attempt++) {
    const id = randomShareId();
    const record: StoredShare = {
      ...canonical,
      editToken,
      createdAt,
      expiresAt,
    };
    const inserted = await redis.set(shareKey(id), record, {
      nx: true,
      ex: SHARE_TTL_SECONDS,
    });
    if (inserted === "OK") {
      const base = origin.replace(/\/$/, "");
      return { id, editToken, url: `${base}/m/${id}`, expiresAt };
    }
  }

  throw new Error("Could not allocate a share id.");
};

export const updateShare = async (
  id: string,
  editToken: string,
  payload: SharePayload,
  origin: string,
): Promise<UpdateShareResult> => {
  if (!isValidShareId(id)) {
    throw new ShareStoreError("Invalid share link.", "invalid_id");
  }

  const redis = getWriteRedis();
  const existing = await redis.get<StoredShare>(shareKey(id));
  if (!existing) {
    throw new ShareStoreError("Share link not found or expired.", "not_found");
  }
  if (new Date(existing.expiresAt).getTime() <= Date.now()) {
    throw new ShareStoreError("Share link has expired.", "expired");
  }
  if (existing.editToken !== editToken) {
    throw new ShareStoreError(
      "Not allowed to update this share.",
      "unauthorized",
    );
  }

  const canonical = canonicalSharePayload(payload);
  const expiresAt = expiresAtFromNow();
  const record: StoredShare = {
    ...canonical,
    editToken: existing.editToken,
    createdAt: existing.createdAt,
    expiresAt,
  };

  await redis.set(shareKey(id), record, { ex: SHARE_TTL_SECONDS });
  const base = origin.replace(/\/$/, "");
  return { id, url: `${base}/m/${id}`, expiresAt };
};

export const resolveShareOrThrow = async (id: string): Promise<PublicShare> => {
  if (!isValidShareId(id)) {
    throw new ShareStoreError("Invalid share link.", "invalid_id");
  }
  const share = await getPublicShare(id);
  if (!share) {
    throw new ShareStoreError("Share link not found or expired.", "not_found");
  }
  return share;
};

export const shareStoreErrorToLinkError = (
  error: ShareStoreError,
): ShareLinkError =>
  new ShareLinkError(
    error.message,
    error.code === "invalid_id"
      ? "invalid_id"
      : error.code === "expired"
        ? "expired"
        : "not_found",
  );
