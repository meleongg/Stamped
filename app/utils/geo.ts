import type { Feature, FeatureCollection } from "geojson";
import { feature } from "topojson-client";
import topology from "@/public/world-atlas/countries-110m.json";

export interface CountryProperties {
  id: string;
  name: string;
}

export type CountryFeature = Feature<GeoJSON.Geometry, CountryProperties>;

type TopologyLike = {
  objects: Record<string, unknown>;
};

let cached: CountryFeature[] | null = null;

export const loadCountries = (): CountryFeature[] => {
  if (cached) return cached;

  const topo = topology as unknown as TopologyLike;
  const countriesObject =
    topo.objects.countries ??
    topo.objects.countries110 ??
    topo.objects.countries_110m;

  if (!countriesObject) {
    cached = [];
    return cached;
  }

  const collection = feature(
    topology as unknown as Parameters<typeof feature>[0],
    countriesObject as unknown as Parameters<typeof feature>[1],
  ) as unknown as FeatureCollection<GeoJSON.Geometry, CountryProperties>;

  cached = collection.features.filter((country) => {
    return (
      country.id !== undefined &&
      country.id !== null &&
      String(country.id) !== "-99" &&
      country.properties &&
      typeof country.properties.name === "string" &&
      country.properties.name.length > 0
    );
  });

  return cached;
};

export const getCountryCode = (feature: CountryFeature): string =>
  String(feature.id);

export const getCountryName = (feature: CountryFeature): string =>
  feature.properties.name;

/** Approximate geographic focus from the exterior ring (average of vertices). */
export const featureFocusLatLng = (
  feature: CountryFeature,
): { lat: number; lng: number } | null => {
  const geometry = feature.geometry;
  let ring: number[][] | undefined;
  if (geometry.type === "Polygon") {
    ring = geometry.coordinates[0];
  } else if (geometry.type === "MultiPolygon") {
    ring = geometry.coordinates[0]?.[0];
  }
  if (!ring || ring.length === 0) return null;

  let latSum = 0;
  let lngSum = 0;
  let count = 0;
  for (const coord of ring) {
    if (coord.length < 2) continue;
    lngSum += coord[0];
    latSum += coord[1];
    count += 1;
  }
  if (count === 0) return null;
  return { lat: latSum / count, lng: lngSum / count };
};
