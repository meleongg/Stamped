import {
  CITY_PIN_MAX_RADIUS_SVG,
  CITY_PIN_MIN_RADIUS_SVG,
  CITY_PIN_RADIUS_PX,
  CITY_PIN_SELECTED_EXTRA_PX,
} from "../constants";

export interface CityPinRadiusInput {
  zoomScale: number;
  containerWidth: number;
  mapWidth: number;
  isSelected?: boolean;
}

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

  const targetPx = isSelected
    ? CITY_PIN_RADIUS_PX + CITY_PIN_SELECTED_EXTRA_PX
    : CITY_PIN_RADIUS_PX;

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
  if (containerWidth <= 0 || zoomScale <= 0) return 2;
  const strokePx = 2;
  const strokeSvg = (strokePx * mapWidth) / containerWidth / zoomScale;
  return Math.max(1, Math.min(3, strokeSvg));
};
