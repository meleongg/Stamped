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
import {
  CITY_PIN_MIN_ZOOM,
  MAP_DIMENSIONS,
  MAP_MAX_ZOOM,
  MAPVIEW_COLORS,
  STATUS_COLORS,
} from "../constants";
import { useTheme } from "../contexts/ThemeContext";
import { CityEntry, TravelStatus } from "../types";
import { CountryFeature } from "../utils/geo";
import {
  computeCityPinOffsets,
  getCityPinRadius,
  getCityPinStrokeWidth,
  getCountryBorderStrokeWidth,
} from "../utils/mapPins";
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
const MAX_SCALE = MAP_MAX_ZOOM;
const ZOOM_STEP = 1.6;
const TRANSITION_MS = 600;
const CLICK_DISTANCE = 5;
/** ~40 km padding when focusing a city (degrees at mid-latitudes). */
const CITY_FOCUS_PAD_DEG = 0.36;

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
  stampedCities?: CityEntry[];
  selectedCityId?: string | null;
  onCityClick?: (cityId: string) => void;
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
  focusCity: (cityId: string, lat: number, lng: number) => void;
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    getCountryStatus,
    getCountryFill,
    onCountryClick,
    selectedCountry,
    hoveredCountry,
    onCountryHover,
    stampedCities = [],
    selectedCityId,
    onCityClick,
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
  const [zoomScale, setZoomScale] = useState(MIN_SCALE);
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
        setZoomScale(event.transform.k);
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

  const focusCity = useCallback(
    (_cityId: string, lat: number, lng: number) => {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      const pad = CITY_FOCUS_PAD_DEG;
      const corners: [number, number][] = [
        [lng - pad, lat - pad],
        [lng + pad, lat - pad],
        [lng + pad, lat + pad],
        [lng - pad, lat + pad],
      ];
      const projected = corners
        .map((c) => projection(c))
        .filter((p): p is [number, number] => p !== null);
      if (projected.length === 0) return;

      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const [x, y] of projected) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }

      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const scale = Math.max(
        MIN_SCALE,
        Math.min(
          MAX_SCALE,
          0.85 /
            Math.max(dx / MAP_DIMENSIONS.WIDTH, dy / MAP_DIMENSIONS.HEIGHT),
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
    [projection],
  );

  useImperativeHandle(
    ref,
    () => ({
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      reset: handleReset,
      focusCountry,
      focusCity,
    }),
    [handleZoomIn, handleZoomOut, handleReset, focusCountry, focusCity],
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

  const showCityPins = zoomScale >= CITY_PIN_MIN_ZOOM;
  const cityPinOffsets = useMemo(
    () =>
      showCityPins
        ? computeCityPinOffsets(
            stampedCities,
            (coords) => projection(coords),
            zoomScale,
            containerWidth,
            MAP_DIMENSIONS.WIDTH,
          )
        : new Map<string, { dx: number; dy: number }>(),
    [showCityPins, stampedCities, projection, zoomScale, containerWidth],
  );
  const cityPinStroke =
    theme === "dark"
      ? MAPVIEW_COLORS.cityPinStrokeDark
      : MAPVIEW_COLORS.cityPinStrokeLight;

  const handleCityPointerMove = (
    event: React.PointerEvent<SVGCircleElement>,
    city: CityEntry,
  ) => {
    if (event.pointerType === "touch") return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      name: city.name,
      status: city.status,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  if (isLoading) {
    return (
      <div className="flex aspect-[5/3] max-h-[600px] w-full items-center justify-center overflow-hidden rounded-lg bg-sky-100 dark:bg-slate-900">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex aspect-[5/3] max-h-[600px] w-full items-center justify-center rounded-lg bg-sky-100 dark:bg-slate-900"
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
            const baseStrokeWidth = isSelected ? 3 : isHovered ? 1 : 0.4;
            const strokeWidth = getCountryBorderStrokeWidth(
              baseStrokeWidth,
              zoomScale,
            );
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
                  if (!onCountryClick) return;
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
                  setTooltip(null);
                  if (!readonly && onCountryHover) onCountryHover(null);
                }}
              />
            );
          })}
          {showCityPins &&
            stampedCities.map((city) => {
              const projected = projection([city.lng, city.lat]);
              if (!projected) return null;
              const [cx, cy] = projected;
              const offset = cityPinOffsets.get(city.cityId);
              const pinX = cx + (offset?.dx ?? 0);
              const pinY = cy + (offset?.dy ?? 0);
              const isSelected = selectedCityId === city.cityId;
              const r = getCityPinRadius({
                zoomScale,
                containerWidth,
                mapWidth: MAP_DIMENSIONS.WIDTH,
                isSelected,
              });
              const strokeWidth = getCityPinStrokeWidth(
                zoomScale,
                containerWidth,
                MAP_DIMENSIONS.WIDTH,
              );
              const fillColor =
                STATUS_COLORS[city.status] ?? STATUS_COLORS.visited;
              return (
                <circle
                  key={city.cityId}
                  cx={pinX}
                  cy={pinY}
                  r={r}
                  fill={fillColor}
                  stroke={cityPinStroke}
                  strokeWidth={strokeWidth}
                  className={
                    readonly
                      ? "pointer-events-auto"
                      : "pointer-events-auto cursor-pointer"
                  }
                  onClick={(e) => {
                    if (readonly || !onCityClick) return;
                    e.stopPropagation();
                    onCityClick(city.cityId);
                  }}
                  onPointerMove={(e) => handleCityPointerMove(e, city)}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== "mouse") return;
                    handleCityPointerMove(e, city);
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType !== "mouse") return;
                    setTooltip(null);
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
