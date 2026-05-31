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
import { Check, Copy, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TravelMapData } from "../types";
import {
  SHARE_NAME_MAX,
  buildShareUrl,
  encodeMap,
  isValidName,
  sanitizeName,
} from "../utils/share";

const SHARE_NAME_STORAGE_KEY = "shareName";
const SHARE_NAME_EXAMPLE = "My Awesome Map";

interface ShareDialogProps {
  travelMapData: TravelMapData;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ travelMapData }) => {
  const [open, setOpen] = useState(false);
  // Lazy init: read remembered name from localStorage once on first render.
  // Safe on the server (returns "") because the dialog content lives in a
  // Radix portal that isn't rendered until the user opens the dialog,
  // which always happens client-side post-hydration.
  const [name, setName] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(SHARE_NAME_STORAGE_KEY) ?? "";
  });
  const [copied, setCopied] = useState(false);

  const trimmedName = sanitizeName(name);
  const countryCount = Object.keys(travelMapData.countries).length;
  const canShare = isValidName(name) && countryCount > 0;

  const shareUrl = useMemo(() => {
    if (!canShare || typeof window === "undefined") return "";
    try {
      return buildShareUrl(window.location.origin, {
        name: trimmedName,
        data: travelMapData,
      });
    } catch {
      return "";
    }
  }, [canShare, trimmedName, travelMapData]);

  const ogPreviewSrc = useMemo(() => {
    if (!canShare || typeof window === "undefined") return "";
    try {
      const encoded = encodeMap({ name: trimmedName, data: travelMapData });
      return `${window.location.origin}/m/${encoded}/opengraph-image`;
    } catch {
      return "";
    }
  }, [canShare, trimmedName, travelMapData]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      window.localStorage.setItem(SHARE_NAME_STORAGE_KEY, trimmedName);
      setCopied(true);
      toast.success("Link copied to clipboard");
      track("share_link_copied", { countries: countryCount });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the link and copy manually.");
    }
  };

  const handleShareNative = async () => {
    if (!shareUrl) return;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: `${trimmedName}'s travel map`,
          text: `Check out ${trimmedName}'s travel map`,
          url: shareUrl,
        });
        window.localStorage.setItem(SHARE_NAME_STORAGE_KEY, trimmedName);
        track("share_link_native", { countries: countryCount });
      } catch {
        // User cancelled native share — no-op.
      }
    } else {
      void handleCopy();
    }
  };

  const totalCountries = countryCount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
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
            We&apos;ll bake your map name and travel statuses into the link.
            Notes and dates stay private on your device.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="share-name">
              Map name
              <span className="ml-1 text-red-500">*</span>
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
              Shown as &quot;{trimmedName || SHARE_NAME_EXAMPLE}&apos;s travel
              map&quot; on the share page.
            </p>
          </div>

          {totalCountries === 0 ? (
            <p className="text-muted-foreground text-sm">
              Add at least one country to your map first.
            </p>
          ) : !isValidName(name) ? (
            <p className="text-muted-foreground text-sm">
              Enter a map name to generate a share link.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="share-url">Share link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    onFocus={(e) => e.currentTarget.select()}
                    className="font-mono text-xs"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    aria-label="Copy share link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {ogPreviewSrc && (
                <div className="flex flex-col gap-2">
                  <Label>Preview</Label>
                  <div className="bg-muted aspect-[1200/630] overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ogPreviewSrc}
                      alt="Share preview"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    This is the image friends will see in iMessage, Twitter,
                    Discord, etc.
                  </p>
                </div>
              )}

              <Button
                onClick={handleShareNative}
                variant="secondary"
                className="flex w-full items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share via…
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
