"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/app/constants";
import { TravelStatus } from "@/app/types";

export interface MapTooltipState {
  name: string;
  status: TravelStatus | null;
  x: number;
  y: number;
}

interface MapTooltipProps {
  state: MapTooltipState | null;
  containerWidth: number;
}

const TOOLTIP_OFFSET = 12;
const TOOLTIP_ESTIMATED_WIDTH = 180;

export const MapTooltip: React.FC<MapTooltipProps> = ({
  state,
  containerWidth,
}) => {
  if (!state) return null;

  // Flip to the left of the cursor when near the right edge.
  const goLeft = state.x + TOOLTIP_OFFSET + TOOLTIP_ESTIMATED_WIDTH > containerWidth;
  const left = goLeft
    ? state.x - TOOLTIP_OFFSET - TOOLTIP_ESTIMATED_WIDTH
    : state.x + TOOLTIP_OFFSET;

  return (
    <div
      role="tooltip"
      aria-hidden
      className="pointer-events-none absolute z-20 rounded-md border border-gray-200 bg-white/95 px-2.5 py-1.5 text-xs shadow-md backdrop-blur dark:border-gray-700 dark:bg-gray-800/95"
      style={{
        left: Math.max(0, left),
        top: Math.max(0, state.y + TOOLTIP_OFFSET),
      }}
    >
      <div className="font-semibold text-gray-900 dark:text-gray-100">
        {state.name}
      </div>
      {state.status ? (
        <div className="mt-0.5 flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[state.status] }}
          />
          {STATUS_LABELS[state.status]}
        </div>
      ) : (
        <div className="mt-0.5 text-gray-500 dark:text-gray-400">
          Not marked
        </div>
      )}
    </div>
  );
};
