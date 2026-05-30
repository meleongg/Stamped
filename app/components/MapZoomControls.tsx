"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, RotateCcw } from "lucide-react";

interface MapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const controlClass = "bg-card/90 hover:bg-card shadow-md cursor-pointer";

export const MapZoomControls: React.FC<MapZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
}) => {
  return (
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
      <Button
        onClick={onZoomIn}
        variant="outline"
        size="icon"
        className={controlClass}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        onClick={onZoomOut}
        variant="outline"
        size="icon"
        className={controlClass}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button
        onClick={onReset}
        variant="outline"
        size="icon"
        className={controlClass}
        aria-label="Reset zoom"
        title="Reset zoom"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};
