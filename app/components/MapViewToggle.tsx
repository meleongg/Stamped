"use client";

import { Button } from "@/components/ui/button";
import { MapViewMode } from "@/app/utils/mapViewMode";
import { Earth, Map } from "lucide-react";

interface MapViewToggleProps {
  mode: MapViewMode;
  onModeChange: (mode: MapViewMode) => void;
}

export const MapViewToggle: React.FC<MapViewToggleProps> = ({
  mode,
  onModeChange,
}) => {
  return (
    <div
      className="border-border bg-card inline-flex rounded-md border p-0.5 shadow-sm"
      role="group"
      aria-label="Map display mode"
    >
      <Button
        type="button"
        size="sm"
        variant={mode === "flat" ? "default" : "ghost"}
        className="h-8 cursor-pointer gap-1.5 px-2.5 text-xs"
        aria-pressed={mode === "flat"}
        onClick={() => onModeChange("flat")}
      >
        <Map className="h-3.5 w-3.5" />
        Map
      </Button>
      <Button
        type="button"
        size="sm"
        variant={mode === "globe" ? "default" : "ghost"}
        className="h-8 cursor-pointer gap-1.5 px-2.5 text-xs"
        aria-pressed={mode === "globe"}
        onClick={() => onModeChange("globe")}
      >
        <Earth className="h-3.5 w-3.5" />
        Globe
      </Button>
    </div>
  );
};
