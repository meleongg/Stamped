import {
  CITY_PIN_MAX_RADIUS_SVG,
  CITY_PIN_MIN_RADIUS_SVG,
  CITY_PIN_MIN_SEPARATION_PX,
  CITY_PIN_MIN_ZOOM,
  CITY_PIN_RADIUS_MAX_PX,
  CITY_PIN_RADIUS_MIN_PX,
  CITY_PIN_SELECTED_EXTRA_PX,
  MAP_MAX_ZOOM,
} from "../constants";
import { CityEntry } from "../types";

export interface CityPinRadiusInput {
  zoomScale: number;
  containerWidth: number;
  mapWidth: number;
  isSelected?: boolean;
}

/** Minimum country border width in SVG units (after zoom counter-scaling). */
export const COUNTRY_BORDER_STROKE_MIN_SVG = 0.06;

/** Smaller pins when zoomed out, larger when zoomed in (mobile-friendly tap targets). */
export const getCityPinTargetRadiusPx = (zoomScale: number): number => {
  const span = MAP_MAX_ZOOM - CITY_PIN_MIN_ZOOM;
  if (span <= 0) return CITY_PIN_RADIUS_MAX_PX;
  const t = Math.min(1, Math.max(0, (zoomScale - CITY_PIN_MIN_ZOOM) / span));
  return (
    CITY_PIN_RADIUS_MIN_PX +
    t * (CITY_PIN_RADIUS_MAX_PX - CITY_PIN_RADIUS_MIN_PX)
  );
};

/** Screen-space pin radius in SVG units (counter-scaled against d3 zoom). */
export const getCityPinRadius = ({
  zoomScale,
  containerWidth,
  mapWidth,
  isSelected = false,
}: CityPinRadiusInput): number => {
  if (containerWidth <= 0 || zoomScale <= 0) {
    return CITY_PIN_MIN_RADIUS_SVG;
  }

  const targetPx =
    getCityPinTargetRadiusPx(zoomScale) +
    (isSelected ? CITY_PIN_SELECTED_EXTRA_PX : 0);

  const radiusSvg = (targetPx * mapWidth) / containerWidth / zoomScale;

  return Math.min(
    CITY_PIN_MAX_RADIUS_SVG,
    Math.max(CITY_PIN_MIN_RADIUS_SVG, radiusSvg),
  );
};

export const getCityPinStrokeWidth = (
  zoomScale: number,
  containerWidth: number,
  mapWidth: number,
): number => {
  if (containerWidth <= 0 || zoomScale <= 0) return 1.5;
  const strokePx = Math.max(1.5, getCityPinTargetRadiusPx(zoomScale) * 0.35);
  const strokeSvg = (strokePx * mapWidth) / containerWidth / zoomScale;
  return Math.max(0.75, Math.min(3, strokeSvg));
};

/**
 * Counter-scale country path stroke against d3 zoom so borders stay thin when
 * zoomed in (small countries like Taiwan remain visible instead of turning
 * into a white ring).
 */
export const getCountryBorderStrokeWidth = (
  baseStroke: number,
  zoomScale: number,
): number => {
  if (zoomScale <= 0) return baseStroke;
  return Math.max(COUNTRY_BORDER_STROKE_MIN_SVG, baseStroke / zoomScale);
};

export interface ProjectPoint {
  (coords: [number, number]): [number, number] | null;
}

/** Nudge overlapping pins apart in map coordinates (e.g. Osaka / Kyoto). */
export const computeCityPinOffsets = (
  cities: CityEntry[],
  project: ProjectPoint,
  zoomScale: number,
  containerWidth: number,
  mapWidth: number,
): Map<string, { dx: number; dy: number }> => {
  const offsets = new Map<string, { dx: number; dy: number }>();
  if (cities.length < 2 || containerWidth <= 0 || zoomScale <= 0) {
    return offsets;
  }

  const pxToSvg = (px: number) => (px * mapWidth) / containerWidth / zoomScale;

  const nodes = cities
    .map((city) => {
      const pt = project([city.lng, city.lat]);
      if (!pt) return null;
      return { id: city.cityId, x: pt[0], y: pt[1] };
    })
    .filter((n): n is NonNullable<typeof n> => n !== null);

  for (const node of nodes) {
    offsets.set(node.id, { dx: 0, dy: 0 });
  }

  const minCenterDist = pxToSvg(
    CITY_PIN_MIN_SEPARATION_PX + getCityPinTargetRadiusPx(zoomScale) * 2,
  );

  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const offA = offsets.get(a.id)!;
        const offB = offsets.get(b.id)!;
        const ax = a.x + offA.dx;
        const ay = a.y + offA.dy;
        const bx = b.x + offB.dx;
        const by = b.y + offB.dy;
        let dx = bx - ax;
        let dy = by - ay;
        let dist = Math.hypot(dx, dy);
        const needed = minCenterDist;

        if (dist >= needed) continue;
        if (dist < 1e-6) {
          const angle = ((i * 7 + j * 13) % 360) * (Math.PI / 180);
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          dist = 1;
        }

        const push = (needed - dist) / 2;
        const ux = dx / dist;
        const uy = dy / dist;
        offA.dx -= ux * push;
        offA.dy -= uy * push;
        offB.dx += ux * push;
        offB.dy += uy * push;
      }
    }
  }

  return offsets;
};
