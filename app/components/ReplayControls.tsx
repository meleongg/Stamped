"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  formatReplayCursorLabel,
  ReplayEvent,
  replayIntervalForSpeed,
} from "@/app/utils/replay";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

const SPEEDS = [1, 2, 4] as const;

interface ReplayControlsProps {
  events: ReplayEvent[];
  undatedCount: number;
  active: boolean;
  onActiveChange: (active: boolean) => void;
  scrubIndex: number;
  onScrubIndexChange: (index: number) => void;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  events,
  undatedCount,
  active,
  onActiveChange,
  scrubIndex,
  onScrubIndexChange,
}) => {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const maxIndex = Math.max(events.length - 1, 0);
  const hasEvents = events.length > 0;
  // Clamp for display/play when the timeline shrinks (e.g. journal date edits).
  const safeScrubIndex = hasEvents
    ? Math.min(Math.max(scrubIndex, -1), maxIndex)
    : -1;
  const effectivelyPlaying = playing && active && hasEvents;

  useEffect(() => {
    if (!effectivelyPlaying) return;
    if (safeScrubIndex >= maxIndex) return;

    const timer = window.setTimeout(() => {
      const next = safeScrubIndex + 1;
      onScrubIndexChange(next);
      if (next >= maxIndex) {
        setPlaying(false);
      }
    }, replayIntervalForSpeed(speed));

    return () => window.clearTimeout(timer);
  }, [
    effectivelyPlaying,
    safeScrubIndex,
    maxIndex,
    speed,
    onScrubIndexChange,
  ]);

  const handleToggleActive = () => {
    if (active) {
      setPlaying(false);
      onActiveChange(false);
      return;
    }
    onActiveChange(true);
    // Begin at the start so Play reveals travels in order.
    onScrubIndexChange(-1);
  };

  const handleReset = () => {
    setPlaying(false);
    onScrubIndexChange(-1);
  };

  const handlePlayPause = () => {
    if (!hasEvents || !active) return;
    if (safeScrubIndex >= maxIndex) {
      onScrubIndexChange(-1);
      setPlaying(true);
      return;
    }
    setPlaying((value) => !value);
  };

  return (
    <div className="border-border bg-card flex w-full flex-col gap-3 rounded-lg border p-3 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-foreground text-sm font-semibold">Replay</p>
          <p className="text-muted-foreground text-xs">
            Watch your travels appear in the order you visited them
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={active ? "default" : "outline"}
          className="cursor-pointer"
          onClick={handleToggleActive}
        >
          {active ? "Done" : "Start"}
        </Button>
      </div>

      {!hasEvents ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          Add visit dates in Journal first, then you can replay your map here.
          {undatedCount > 0
            ? ` ${undatedCount} visited ${undatedCount === 1 ? "place still needs" : "places still need"} an explicit visit date (stamp day alone is enough for cities to appear).`
            : ""}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="replay-scrub" className="text-xs">
                {formatReplayCursorLabel(events, safeScrubIndex)}
              </Label>
              <span className="text-muted-foreground text-xs tabular-nums">
                {safeScrubIndex < 0 ? 0 : safeScrubIndex + 1}/{events.length}
              </span>
            </div>
            <input
              id="replay-scrub"
              type="range"
              min={-1}
              max={maxIndex}
              step={1}
              value={safeScrubIndex}
              disabled={!active}
              onChange={(event) => {
                setPlaying(false);
                onScrubIndexChange(Number(event.target.value));
              }}
              className="accent-primary w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              aria-valuetext={formatReplayCursorLabel(events, safeScrubIndex)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="cursor-pointer gap-1.5"
              disabled={!active}
              onClick={handlePlayPause}
              aria-label={playing ? "Pause replay" : "Play replay"}
            >
              {playing ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              {playing ? "Pause" : "Play"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="cursor-pointer gap-1.5"
              disabled={!active}
              onClick={handleReset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Start over
            </Button>
            <div className="ml-auto flex items-center gap-1">
              {SPEEDS.map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={speed === value ? "outline" : "ghost"}
                  className="h-7 cursor-pointer px-2 text-xs tabular-nums"
                  disabled={!active}
                  onClick={() => setSpeed(value)}
                >
                  {value}×
                </Button>
              ))}
            </div>
          </div>

          {active && undatedCount > 0 && (
            <p className="text-muted-foreground text-xs leading-relaxed">
              {undatedCount} visited{" "}
              {undatedCount === 1 ? "place is" : "places are"} missing an
              explicit visit date. Cities still appear on their stamp day;
              undated countries stay off replay until you add a date in Journal.
            </p>
          )}
        </>
      )}
    </div>
  );
};
