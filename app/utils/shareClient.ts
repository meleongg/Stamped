import { SharePayload, stripForShare } from "@/app/utils/sharePayload";

const SHARE_ID_KEY = "shareId";
const SHARE_EDIT_TOKEN_KEY = "shareEditToken";
const SHARE_PAYLOAD_HASH_KEY = "sharePayloadHash";
const SHARE_EXPIRES_AT_KEY = "shareExpiresAt";

export interface ShareLinkState {
  shareId: string;
  editToken: string;
  payloadHash: string;
  expiresAt: string;
}

export interface EnsureShareLinkResult {
  url: string;
  shareId: string;
  expiresAt: string;
  created: boolean;
  updated: boolean;
}

const readState = (): Partial<ShareLinkState> => {
  if (typeof window === "undefined") return {};
  return {
    shareId: window.localStorage.getItem(SHARE_ID_KEY) ?? undefined,
    editToken: window.localStorage.getItem(SHARE_EDIT_TOKEN_KEY) ?? undefined,
    payloadHash:
      window.localStorage.getItem(SHARE_PAYLOAD_HASH_KEY) ?? undefined,
    expiresAt: window.localStorage.getItem(SHARE_EXPIRES_AT_KEY) ?? undefined,
  };
};

const writeState = (state: ShareLinkState): void => {
  window.localStorage.setItem(SHARE_ID_KEY, state.shareId);
  window.localStorage.setItem(SHARE_EDIT_TOKEN_KEY, state.editToken);
  window.localStorage.setItem(SHARE_PAYLOAD_HASH_KEY, state.payloadHash);
  window.localStorage.setItem(SHARE_EXPIRES_AT_KEY, state.expiresAt);
};

export const ensureShareLink = async (
  payload: SharePayload,
  payloadHash: string,
): Promise<EnsureShareLinkResult> => {
  const body = {
    name: payload.name,
    data: stripForShare(payload.data),
  };
  const cached = readState();

  if (
    cached.shareId &&
    cached.payloadHash === payloadHash &&
    cached.expiresAt
  ) {
    const origin = window.location.origin.replace(/\/$/, "");
    return {
      url: `${origin}/m/${cached.shareId}`,
      shareId: cached.shareId,
      expiresAt: cached.expiresAt,
      created: false,
      updated: false,
    };
  }

  if (cached.shareId && cached.editToken) {
    const response = await fetch(`/api/share/${cached.shareId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, editToken: cached.editToken }),
    });
    if (response.ok) {
      const result = (await response.json()) as {
        id: string;
        url: string;
        expiresAt: string;
      };
      writeState({
        shareId: result.id,
        editToken: cached.editToken,
        payloadHash,
        expiresAt: result.expiresAt,
      });
      return {
        url: result.url,
        shareId: result.id,
        expiresAt: result.expiresAt,
        created: false,
        updated: true,
      };
    }
  }

  const response = await fetch("/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(data.error ?? "Could not create share link.");
  }

  const result = (await response.json()) as {
    id: string;
    editToken: string;
    url: string;
    expiresAt: string;
  };
  writeState({
    shareId: result.id,
    editToken: result.editToken,
    payloadHash,
    expiresAt: result.expiresAt,
  });
  return {
    url: result.url,
    shareId: result.id,
    expiresAt: result.expiresAt,
    created: true,
    updated: false,
  };
};

/** Persist map name separately (existing behavior). */
export const persistShareName = (name: string): void => {
  window.localStorage.setItem("shareName", name);
};
