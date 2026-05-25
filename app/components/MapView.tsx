"use client";

import { geoNaturalEarth1, geoPath } from "d3-geo";
import { select } from "d3-selection";
import "d3-transition";
import { zoom, ZoomBehavior, zoomIdentity } from "d3-zoom";
import { useEffect, useRef } from "react";
import { MAP_DIMENSIONS, MAPVIEW_COLORS, STATUS_COLORS } from "../constants";
import { useTheme } from "../contexts/ThemeContext";
import { TravelStatus } from "../types";
import { CountryFeature } from "../utils/geo";
import { ExportButton } from "./ExportButton";

const STATUS_HOVER_COLORS: Record<TravelStatus, string> = {
  visited: MAPVIEW_COLORS.visitedHover,
  planning: MAPVIEW_COLORS.planningHover,
  want_to_visit: MAPVIEW_COLORS.wantToVisitHover,
  avoid: MAPVIEW_COLORS.avoidHover,
};

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

export const MapView: React.FC<MapViewProps> = ({
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
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const { theme } = useTheme();

  const projection = geoNaturalEarth1()
    .scale(180)
    .translate([MAP_DIMENSIONS.WIDTH / 2, MAP_DIMENSIONS.HEIGHT / 2 + 20]);

  const pathGenerator = geoPath().projection(projection);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = select(svgRef.current);
    const g = select(gRef.current);

    const zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> = zoom<
      SVGSVGElement,
      unknown
    >()
      .scaleExtent([0.5, 8])
      .filter((event) => {
        return !event.ctrlKey && !event.button;
      })
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    const svgNode = svg.node() as SVGSVGElement & {
      __zoomBehavior?: ZoomBehavior<SVGSVGElement, unknown>;
    };
    svgNode.__zoomBehavior = zoomBehavior;

    return () => {
      svg.on(".zoom", null);
    };
  }, [countries]);

  const handleResetZoom = () => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    const svgNode = svg.node() as SVGSVGElement & {
      __zoomBehavior?: ZoomBehavior<SVGSVGElement, unknown>;
    };
    const zoomBehavior = svgNode.__zoomBehavior;

    if (zoomBehavior) {
      svg.transition().duration(750).call(zoomBehavior.transform, zoomIdentity);
    }
  };

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

  if (isLoading) {
    return (
      <div className="w-full bg-blue-50 dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center aspect-[5/3] max-h-[600px]">
        <div className="text-gray-600 dark:text-gray-300">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-blue-50 dark:bg-slate-900 rounded-lg flex items-center justify-center aspect-[5/3] max-h-[600px]">
      {showExport && (
        <ExportButton svgRef={svgRef} onResetZoom={handleResetZoom} />
      )}

      <div className="absolute top-2 left-2 z-10 bg-white/90 dark:bg-gray-800/90 rounded-md px-2 py-1 text-xs text-gray-600 dark:text-gray-300">
        Scroll to zoom • Drag to pan
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_DIMENSIONS.WIDTH} ${MAP_DIMENSIONS.HEIGHT}`}
        width="100%"
        height="100%"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ touchAction: "none" }}
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
            const strokeWidth = String(isSelected || isHovered ? 2 : 0.5);
            return (
              <path
                key={countryCode}
                d={pathData}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                className={
                  readonly
                    ? "transition-all duration-200"
                    : "cursor-pointer transition-all duration-200"
                }
                onClick={(e) => {
                  if (readonly || !onCountryClick) return;
                  e.stopPropagation();
                  onCountryClick(countryCode);
                }}
                onMouseEnter={() => {
                  if (readonly) return;
                  if (onCountryHover) onCountryHover(countryCode);
                }}
                onMouseLeave={() => {
                  if (readonly) return;
                  if (onCountryHover) onCountryHover(null);
                }}
              >
                <title>{countryName || countryCode}</title>
              </path>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
