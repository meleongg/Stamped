export interface ShareLinkPayload {
  url: string;
  title: string;
  text: string;
}

export interface DesktopShareAction {
  id: "copy" | "email" | "whatsapp";
  label: string;
  href?: string;
}

export const isNativeShareAvailable = (url: string): boolean => {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  if (navigator.canShare) {
    try {
      return navigator.canShare({ url, title: "Share", text: "Share" });
    } catch {
      return false;
    }
  }
  return true;
};

/** Prefer system share sheet on phones/tablets; desktop uses the fallback menu. */
export const shouldUseNativeShare = (url: string): boolean => {
  if (!isNativeShareAvailable(url)) return false;
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 768px)").matches;
  return coarse || narrow;
};

export type NativeShareResult = "shared" | "cancelled" | "unavailable";

export const shareLinkNative = async (
  payload: ShareLinkPayload,
): Promise<NativeShareResult> => {
  if (!isNativeShareAvailable(payload.url)) return "unavailable";
  try {
    await navigator.share({
      title: payload.title,
      text: payload.text,
      url: payload.url,
    });
    return "shared";
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return "cancelled";
    }
    return "unavailable";
  }
};

export const getDesktopShareActions = (
  payload: ShareLinkPayload,
): DesktopShareAction[] => {
  const body = `${payload.text}\n\n${payload.url}`;
  return [
    { id: "copy", label: "Copy link" },
    {
      id: "email",
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent(payload.title)}&body=${encodeURIComponent(body)}`,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${payload.text} ${payload.url}`)}`,
    },
  ];
};
