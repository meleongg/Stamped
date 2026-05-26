"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, RotateCcw } from "lucide-react";

interface MapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const controlClass =
  "bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-md cursor-pointer";

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
        <Plus className="w-4 h-4" />
      </Button>
      <Button
        onClick={onZoomOut}
        variant="outline"
        size="icon"
        className={controlClass}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <Minus className="w-4 h-4" />
      </Button>
      <Button
        onClick={onReset}
        variant="outline"
        size="icon"
        className={controlClass}
        aria-label="Reset zoom"
        title="Reset zoom"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
    </div>
  );
};
