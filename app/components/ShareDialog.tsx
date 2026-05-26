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
import { Check, Copy, Share2 } from "lucide-react";
import { track } from "@vercel/analytics";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MapData } from "../types";
import {
  SHARE_NAME_MAX,
  buildShareUrl,
  encodeMap,
  isValidName,
  sanitizeName,
} from "../utils/share";

const SHARE_NAME_STORAGE_KEY = "shareName";

interface ShareDialogProps {
  mapData: MapData;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ mapData }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(SHARE_NAME_STORAGE_KEY);
    if (saved) setName(saved);
  }, []);

  const trimmedName = sanitizeName(name);
  const canShare = isValidName(name) && Object.keys(mapData).length > 0;

  const shareUrl = useMemo(() => {
    if (!canShare || typeof window === "undefined") return "";
    try {
      return buildShareUrl(window.location.origin, {
        name: trimmedName,
        data: mapData,
      });
    } catch {
      return "";
    }
  }, [canShare, trimmedName, mapData]);

  const ogPreviewSrc = useMemo(() => {
    if (!canShare || typeof window === "undefined") return "";
    try {
      const encoded = encodeMap({ name: trimmedName, data: mapData });
      return `${window.location.origin}/m/${encoded}/opengraph-image`;
    } catch {
      return "";
    }
  }, [canShare, trimmedName, mapData]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      window.localStorage.setItem(SHARE_NAME_STORAGE_KEY, trimmedName);
      setCopied(true);
      toast.success("Link copied to clipboard");
      track("share_link_copied", { countries: Object.keys(mapData).length });
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
        track("share_link_native", { countries: Object.keys(mapData).length });
      } catch {
        // User cancelled native share — no-op.
      }
    } else {
      void handleCopy();
    }
  };

  const totalCountries = Object.keys(mapData).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="w-full flex items-center justify-center gap-2 cursor-pointer"
          disabled={totalCountries === 0}
          title={
            totalCountries === 0
              ? "Add at least one country before sharing"
              : "Share your map"
          }
        >
          <Share2 className="w-4 h-4" />
          Share my map
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share your travel map</DialogTitle>
          <DialogDescription>
            We&apos;ll bake your name and country statuses into the link. Notes
            and dates stay private on your device.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="share-name">
              Your name
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="share-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Melvin"
              maxLength={SHARE_NAME_MAX}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Shown as &quot;{trimmedName || "Your name"}&apos;s travel map&quot;
              on the share page.
            </p>
          </div>

          {totalCountries === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add at least one country to your map first.
            </p>
          ) : !isValidName(name) ? (
            <p className="text-sm text-muted-foreground">
              Enter your name to generate a share link.
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
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {ogPreviewSrc && (
                <div className="flex flex-col gap-2">
                  <Label>Preview</Label>
                  <div className="rounded-md border bg-muted overflow-hidden aspect-[1200/630]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ogPreviewSrc}
                      alt="Share preview"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This is the image friends will see in iMessage, Twitter,
                    Discord, etc.
                  </p>
                </div>
              )}

              <Button
                onClick={handleShareNative}
                variant="secondary"
                className="w-full flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share via…
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
