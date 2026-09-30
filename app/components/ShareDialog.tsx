"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@vercel/analytics";
import {
  Check,
  Copy,
  Loader2,
  Mail,
  MessageCircle,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { TravelMapData } from "../types";
import {
  formatShareExpiryLabel,
  formatShareNativeText,
  formatShareNativeTitle,
  isValidName,
  sanitizeName,
  SHARE_NAME_MAX,
} from "../utils/share";
import { canonicalSharePayload, hashSharePayload } from "../utils/sharePayload";
import { ensureShareLink, persistShareName } from "../utils/shareClient";
import {
  getDesktopShareActions,
  shareLinkNative,
  shouldUseNativeShare,
} from "../utils/shareLink";

const SHARE_NAME_STORAGE_KEY = "shareName";
const SHARE_NAME_EXAMPLE = "My Awesome Map";

interface ShareDialogProps {
  travelMapData: TravelMapData;
  /** Outline when nested in a secondary action group (e.g. shared map page). */
  triggerVariant?: "default" | "outline";
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  travelMapData,
  triggerVariant = "default",
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(SHARE_NAME_STORAGE_KEY) ?? "";
  });
  const [copied, setCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareId, setShareId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [linkCreated, setLinkCreated] = useState(false);
  const [linkUpdated, setLinkUpdated] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const linkRequestRef = useRef(0);

  const trimmedName = sanitizeName(name);
  const countryCount = Object.keys(travelMapData.countries).length;
  const canShare = isValidName(name) && countryCount > 0;

  const syncShareLink = useCallback(async () => {
    if (!canShare || typeof window === "undefined") return;

    const requestId = ++linkRequestRef.current;
    setLinkLoading(true);
    setLinkError(null);

    try {
      const payload = canonicalSharePayload({
        name: trimmedName,
        data: travelMapData,
      });
      const payloadHash = await hashSharePayload(payload);
      const result = await ensureShareLink(payload, payloadHash);

      if (requestId !== linkRequestRef.current) return;

      setShareUrl(result.url);
      setShareId(result.shareId);
      setExpiresAt(result.expiresAt);
      setLinkCreated(result.created);
      setLinkUpdated(result.updated);
    } catch (error) {
      if (requestId !== linkRequestRef.current) return;
      const message =
        error instanceof Error
          ? error.message
          : "Could not generate share link.";
      setLinkError(message);
      setShareUrl("");
      setShareId("");
      setExpiresAt("");
      setLinkCreated(false);
      setLinkUpdated(false);
    } finally {
      if (requestId === linkRequestRef.current) {
        setLinkLoading(false);
      }
    }
  }, [canShare, trimmedName, travelMapData]);

  useEffect(() => {
    if (!open || !canShare) return;
    const timer = window.setTimeout(() => {
      void syncShareLink();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, canShare, syncShareLink]);

  const sharePayload = useMemo(
    () => ({
      url: shareUrl,
      title: formatShareNativeTitle(trimmedName),
      text: formatShareNativeText(trimmedName),
    }),
    [shareUrl, trimmedName],
  );

  const useNativeShare = useMemo(
    () => (shareUrl ? shouldUseNativeShare(shareUrl) : false),
    [shareUrl],
  );

  const desktopShareActions = useMemo(
    () => (shareUrl ? getDesktopShareActions(sharePayload) : []),
    [shareUrl, sharePayload],
  );

  const ogPreviewSrc =
    shareId && expiresAt && typeof window !== "undefined"
      ? `${window.location.origin}/m/${shareId}/opengraph-image?v=${encodeURIComponent(expiresAt)}`
      : "";

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      persistShareName(trimmedName);
      setCopied(true);
      toast.success("Link copied to clipboard");
      track("share_link_copied", { countries: countryCount });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the link and copy manually.");
    }
  };

  const handleShareViaClick = async () => {
    if (!shareUrl) return;

    if (useNativeShare) {
      const result = await shareLinkNative(sharePayload);
      if (result === "shared") {
        persistShareName(trimmedName);
        toast.success("Shared successfully");
        track("share_link_native", { countries: countryCount });
      } else if (result === "unavailable") {
        setShareMenuOpen(true);
      }
      return;
    }

    setShareMenuOpen((open) => !open);
  };

  const handleDesktopShareAction = async (
    action: (typeof desktopShareActions)[number],
  ) => {
    if (action.id === "copy") {
      await handleCopy();
      setShareMenuOpen(false);
      return;
    }
    if (action.href) {
      window.open(action.href, "_blank", "noopener,noreferrer");
      persistShareName(trimmedName);
      toast.success(`Opening ${action.label}…`);
      setShareMenuOpen(false);
    }
  };

  const totalCountries = countryCount;

  useEffect(() => {
    if (!shareMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(event.target as Node)
      ) {
        setShareMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [shareMenuOpen]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setShareMenuOpen(false);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          className="flex w-full cursor-pointer items-center justify-center gap-2"
          disabled={totalCountries === 0}
          title={
            totalCountries === 0
              ? "Add at least one country before sharing"
              : "Share your map"
          }
        >
          <Share2 className="h-4 w-4" />
          Share my map
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[min(100vw-2rem,32rem)]">
        <DialogHeader>
          <DialogTitle>Share your travel map</DialogTitle>
          <DialogDescription>
            Create a link friends can open. You can update it anytime from this
            browser.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <ul className="bg-muted/60 text-muted-foreground space-y-1.5 rounded-md px-3 py-2.5 text-xs leading-relaxed">
            <li className="flex gap-2">
              <span aria-hidden className="text-foreground shrink-0">
                •
              </span>
              <span>
                Shared: map name and country/city statuses (for 90 days of
                inactivity).
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-foreground shrink-0">
                •
              </span>
              <span>Private on this device: notes and visit dates.</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-foreground shrink-0">
                •
              </span>
              <span>
                Details in{" "}
                <Link
                  href="/privacy"
                  className="text-foreground underline underline-offset-2"
                >
                  Privacy
                </Link>
                .
              </span>
            </li>
          </ul>

          <div className="flex flex-col gap-2">
            <Label htmlFor="share-name" className="w-fit gap-0">
              Map name<span className="text-red-500">*</span>
            </Label>
            <Input
              id="share-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g. ${SHARE_NAME_EXAMPLE}`}
              maxLength={SHARE_NAME_MAX}
              autoFocus
              className="w-full"
            />
            <p className="text-muted-foreground text-xs">
              Shown as the title at the top of the share page.
            </p>
          </div>

          {totalCountries === 0 ? (
            <p className="text-muted-foreground text-sm">
              Add at least one country to your map, then come back to share.
            </p>
          ) : !isValidName(name) ? (
            <p className="text-muted-foreground text-sm">
              Give your map a short name to generate a link.
            </p>
          ) : linkError ? (
            <div className="border-destructive/30 bg-destructive/5 flex flex-col gap-2 rounded-md border px-3 py-3">
              <p className="text-destructive text-sm font-medium">
                Couldn&apos;t create a share link
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {linkError}
              </p>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => void syncShareLink()}
              >
                Try again
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="share-url">Share link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-url"
                    value={linkLoading ? "Generating link…" : shareUrl}
                    readOnly
                    onFocus={(e) => e.currentTarget.select()}
                    className="font-mono text-xs"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="icon"
                    className="shrink-0 cursor-pointer"
                    aria-label="Copy share link"
                    disabled={!shareUrl || linkLoading}
                  >
                    {linkLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {expiresAt && !linkLoading && (
                  <div className="text-muted-foreground flex flex-col gap-1 text-xs leading-relaxed">
                    <p className="text-foreground font-medium">
                      {formatShareExpiryLabel(expiresAt)}
                    </p>
                    {linkCreated ? (
                      <p>
                        New link created for this browser. Older links (if any)
                        keep working until they expire, but updates from here go
                        to this one.
                      </p>
                    ) : linkUpdated ? (
                      <p>Your shared map was updated to match this device.</p>
                    ) : (
                      <p>
                        Opening Share refreshes the link when your map has
                        changed.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {ogPreviewSrc && !linkLoading && (
                <div className="flex flex-col gap-2">
                  <Label>Preview</Label>
                  <div className="bg-muted aspect-[1200/630] overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={expiresAt}
                      src={ogPreviewSrc}
                      alt="Share preview"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Preview image for iMessage, Discord, and similar apps.
                  </p>
                </div>
              )}

              <div ref={shareMenuRef} className="relative">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex w-full cursor-pointer items-center justify-center gap-2"
                  onClick={handleShareViaClick}
                  aria-expanded={shareMenuOpen}
                  aria-haspopup="menu"
                  disabled={!shareUrl || linkLoading}
                >
                  <Share2 className="h-4 w-4" />
                  Share via…
                </Button>
                {!useNativeShare && shareMenuOpen && (
                  <div className="border-border bg-popover absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-md border p-1 shadow-md">
                    <ul className="flex flex-col" role="menu">
                      {desktopShareActions.map((action) => (
                        <li key={action.id} role="none">
                          <button
                            type="button"
                            role="menuitem"
                            className="hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2.5 text-sm transition-colors"
                            onClick={() => handleDesktopShareAction(action)}
                          >
                            {action.id === "copy" && (
                              <Copy className="h-4 w-4 shrink-0 opacity-70" />
                            )}
                            {action.id === "email" && (
                              <Mail className="h-4 w-4 shrink-0 opacity-70" />
                            )}
                            {action.id === "whatsapp" && (
                              <MessageCircle className="h-4 w-4 shrink-0 opacity-70" />
                            )}
                            {action.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {!useNativeShare && (
                <p className="text-muted-foreground text-center text-xs">
                  Pick how to send your link
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
