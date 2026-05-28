"use client";

import { geoNaturalEarth1, geoPath } from "d3-geo";
import { select } from "d3-selection";
import "d3-transition";
import { zoom, ZoomBehavior, zoomIdentity } from "d3-zoom";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { MAP_DIMENSIONS, MAPVIEW_COLORS, STATUS_COLORS } from "../constants";
import { useTheme } from "../contexts/ThemeContext";
import { TravelStatus } from "../types";
import { CountryFeature } from "../utils/geo";
import { ExportButton } from "./ExportButton";
import { MapTooltip, MapTooltipState } from "./MapTooltip";
import { MapZoomControls } from "./MapZoomControls";

const STATUS_HOVER_COLORS: Record<TravelStatus, string> = {
  visited: MAPVIEW_COLORS.visitedHover,
  planning: MAPVIEW_COLORS.planningHover,
  want_to_visit: MAPVIEW_COLORS.wantToVisitHover,
  avoid: MAPVIEW_COLORS.avoidHover,
};

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const ZOOM_STEP = 1.6;
const TRANSITION_MS = 600;
const CLICK_DISTANCE = 5;

interface MapViewProps {
  getCountryStatus: (countryCode: string) => TravelStatus | null;
  getCountryFill?: (
    countryCode: string,
    fallback: string,
  ) => string | undefined;
  onCountryClick?: (countryCode: string) => void;
  selectedCountry?: string | null;
  hoveredCountry?: string | null;
  onCountryHover?: (countryCode: string | null) => void;
  countries: CountryFeature[];
  isLoading: boolean;
  readonly?: boolean;
  showExport?: boolean;
}

export interface MapViewHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  focusCountry: (countryCode: string) => void;
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    getCountryStatus,
    getCountryFill,
    onCountryClick,
    selectedCountry,
    hoveredCountry,
    onCountryHover,
    countries,
    isLoading,
    readonly = false,
    showExport = true,
  },
  ref,
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(
    null,
  );
  const [tooltip, setTooltip] = useState<MapTooltipState | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const { theme } = useTheme();

  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .scale(180)
        .translate([MAP_DIMENSIONS.WIDTH / 2, MAP_DIMENSIONS.HEIGHT / 2 + 20]),
    [],
  );

  const pathGenerator = useMemo(
    () => geoPath().projection(projection),
    [projection],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = select(svgRef.current);
    const g = select(gRef.current);

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .translateExtent([
        [0, 0],
        [MAP_DIMENSIONS.WIDTH, MAP_DIMENSIONS.HEIGHT],
      ])
      .clickDistance(CLICK_DISTANCE)
      // d3-zoom's default filter, restored: allow trackpad pinch (wheel +
      // ctrlKey) which the previous filter was incorrectly blocking on Mac.
      .filter((event) => {
        return (!event.ctrlKey || event.type === "wheel") && !event.button;
      })
      .on("start", (event) => {
        if (event.sourceEvent?.type === "mousedown") setIsPanning(true);
      })
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      })
      .on("end", () => setIsPanning(false));

    svg.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    return () => {
      svg.on(".zoom", null);
      zoomBehaviorRef.current = null;
    };
  }, [countries]);

  const animateZoomBy = useCallback((factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.scaleBy, factor);
  }, []);

  const handleZoomIn = useCallback(
    () => animateZoomBy(ZOOM_STEP),
    [animateZoomBy],
  );
  const handleZoomOut = useCallback(
    () => animateZoomBy(1 / ZOOM_STEP),
    [animateZoomBy],
  );

  const handleReset = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current)
      .transition()
      .duration(TRANSITION_MS)
      .call(zoomBehaviorRef.current.transform, zoomIdentity);
  }, []);

  const focusCountry = useCallback(
    (countryCode: string) => {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      const target = countries.find((c) => String(c.id) === countryCode);
      if (!target) return;

      const [[x0, y0], [x1, y1]] = pathGenerator.bounds(target);
      const dx = x1 - x0;
      const dy = y1 - y0;
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;

      // Fit the country bounds into ~60% of the viewport, clamped to scaleExtent.
      const scale = Math.max(
        MIN_SCALE,
        Math.min(
          MAX_SCALE,
          0.6 / Math.max(dx / MAP_DIMENSIONS.WIDTH, dy / MAP_DIMENSIONS.HEIGHT),
        ),
      );

      const transform = zoomIdentity
        .translate(MAP_DIMENSIONS.WIDTH / 2, MAP_DIMENSIONS.HEIGHT / 2)
        .scale(scale)
        .translate(-cx, -cy);

      select(svgRef.current)
        .transition()
        .duration(TRANSITION_MS)
        .call(zoomBehaviorRef.current.transform, transform);
    },
    [countries, pathGenerator],
  );

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      reset: handleReset,
      focusCountry,
    }),
    [handleZoomIn, handleZoomOut, handleReset, focusCountry],
  );

  const baseFill =
    theme === "dark"
      ? MAPVIEW_COLORS.unvisitedFillDark
      : MAPVIEW_COLORS.unvisitedFill;

  const computeFill = (countryCode: string): string => {
    if (getCountryFill) {
      const custom = getCountryFill(countryCode, baseFill);
      if (custom) return custom;
    }
    const status = getCountryStatus(countryCode);
    if (status) {
      return STATUS_COLORS[status];
    }
    return baseFill;
  };

  const handlePointerMoveOnPath = (
    event: React.PointerEvent<SVGPathElement>,
    countryCode: string,
    countryName: string,
  ) => {
    if (event.pointerType === "touch") return; // tooltip is mouse-only
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      name: countryName,
      status: getCountryStatus(countryCode),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  if (isLoading) {
    return (
      <div className="flex aspect-[5/3] max-h-[600px] w-full items-center justify-center overflow-hidden rounded-lg bg-blue-50 dark:bg-slate-900">
        <div className="text-gray-600 dark:text-gray-300">Loading map...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex aspect-[5/3] max-h-[600px] w-full items-center justify-center rounded-lg bg-blue-50 dark:bg-slate-900"
      onPointerLeave={() => setTooltip(null)}
    >
      <MapZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
      />
      {showExport && <ExportButton svgRef={svgRef} />}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_DIMENSIONS.WIDTH} ${MAP_DIMENSIONS.HEIGHT}`}
        width="100%"
        height="100%"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        style={{
          touchAction: "none",
          cursor: isPanning ? "grabbing" : "grab",
        }}
      >
        <g ref={gRef}>
          {countries.map((country, index) => {
            const countryCode = country.id ? String(country.id) : String(index);
            const countryName = country.properties.name;
            const pathData = pathGenerator(country);
            if (!pathData) return null;
            const isHovered = hoveredCountry === countryCode;
            const isSelected = selectedCountry === countryCode;
            let fillColor = computeFill(countryCode);
            if (!readonly && isHovered && !isSelected) {
              const status = getCountryStatus(countryCode);
              fillColor = status
                ? STATUS_HOVER_COLORS[status]
                : theme === "dark"
                  ? MAPVIEW_COLORS.hoverFillDark
                  : MAPVIEW_COLORS.hoverFill;
            }
            const strokeColor = isSelected
              ? theme === "dark"
                ? MAPVIEW_COLORS.selectedStrokeDark
                : MAPVIEW_COLORS.selectedStroke
              : isHovered
                ? theme === "dark"
                  ? MAPVIEW_COLORS.hoverStrokeDark
                  : MAPVIEW_COLORS.hoverStroke
                : theme === "dark"
                  ? MAPVIEW_COLORS.borderStrokeDark
                  : MAPVIEW_COLORS.borderStroke;
            const strokeWidth = isSelected ? "3" : isHovered ? "1" : "0";
            return (
              <path
                key={countryCode}
                d={pathData}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                className={
                  readonly
                    ? "transition-colors duration-150"
                    : "cursor-pointer transition-colors duration-150"
                }
                onClick={(e) => {
                  if (readonly || !onCountryClick) return;
                  e.stopPropagation();
                  onCountryClick(countryCode);
                }}
                onPointerMove={(e) =>
                  handlePointerMoveOnPath(e, countryCode, countryName)
                }
                onPointerEnter={(e) => {
                  if (e.pointerType !== "mouse") return;
                  if (!readonly && onCountryHover) onCountryHover(countryCode);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType !== "mouse") return;
                  if (!readonly && onCountryHover) onCountryHover(null);
                }}
              />
            );
          })}
        </g>
      </svg>

      <MapTooltip state={tooltip} containerWidth={containerWidth} />
    </div>
  );
});
