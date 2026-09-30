"use client";

import { MAP_DIMENSIONS } from "@/app/constants";
import { useTheme } from "@/app/contexts/ThemeContext";
import { CityEntry, TravelStatus } from "@/app/types";
import {
  globeBackgroundColor,
  globeCityPointColor,
  globeCountryCapColor,
  globeSideColor,
  globeStrokeColor,
} from "@/app/utils/globeColors";
import { CountryFeature, getCountryCode, getCountryName } from "@/app/utils/geo";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GlobeMethods } from "react-globe.gl";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

interface GlobeViewProps {
  getCountryStatus: (countryCode: string) => TravelStatus | null;
  stampedCities?: CityEntry[];
  countries: CountryFeature[];
  selectedCountry?: string | null;
  selectedCityId?: string | null;
}

const ASPECT = MAP_DIMENSIONS.WIDTH / MAP_DIMENSIONS.HEIGHT;

export const GlobeView: React.FC<GlobeViewProps> = ({
  getCountryStatus,
  stampedCities = [],
  countries,
  selectedCountry = null,
  selectedCityId = null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { theme } = useTheme();

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      const width = node.clientWidth;
      const height = Math.min(600, Math.round(width / ASPECT));
      setSize({ width, height });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const pointsData = useMemo(
    () =>
      stampedCities.map((city) => ({
        ...city,
        color: globeCityPointColor(city.status),
      })),
    [stampedCities],
  );

  const bg = globeBackgroundColor(theme);
  const side = globeSideColor(theme);
  const stroke = globeStrokeColor(theme);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    if (selectedCityId) {
      const city = stampedCities.find((c) => c.cityId === selectedCityId);
      if (city) {
        globe.pointOfView({ lat: city.lat, lng: city.lng, altitude: 1.4 }, 800);
        return;
      }
    }

    if (selectedCountry) {
      const feature = countries.find(
        (c) => getCountryCode(c) === selectedCountry,
      );
      if (!feature) return;
      if (feature.geometry.type === "Polygon") {
        const [lng, lat] = feature.geometry.coordinates[0]?.[0] ?? [0, 0];
        globe.pointOfView({ lat, lng, altitude: 1.6 }, 800);
      } else if (feature.geometry.type === "MultiPolygon") {
        const [lng, lat] =
          feature.geometry.coordinates[0]?.[0]?.[0] ?? [0, 0];
        globe.pointOfView({ lat, lng, altitude: 1.6 }, 800);
      }
    }
  }, [selectedCityId, selectedCountry, stampedCities, countries]);

  return (
    <div
      ref={containerRef}
      className="relative flex aspect-[5/3] max-h-[600px] w-full items-center justify-center overflow-hidden rounded-lg"
      style={{ backgroundColor: bg }}
      aria-label="Read-only 3D globe of the travel map"
    >
      {size.width > 0 && size.height > 0 ? (
        <Globe
          // dynamic() ref typing is loose; globe.gl accepts the imperative handle.
          ref={globeRef as never}
          width={size.width}
          height={size.height}
          backgroundColor={bg}
          showAtmosphere
          atmosphereColor={theme === "dark" ? "#38bdf8" : "#7dd3fc"}
          atmosphereAltitude={0.12}
          polygonsData={countries}
          polygonGeoJsonGeometry="geometry"
          polygonCapColor={(d) => {
            const feature = d as CountryFeature;
            return globeCountryCapColor(
              getCountryStatus(getCountryCode(feature)),
              theme,
            );
          }}
          polygonSideColor={() => side}
          polygonStrokeColor={() => stroke}
          polygonAltitude={(d) => {
            const feature = d as CountryFeature;
            const code = getCountryCode(feature);
            if (selectedCountry && selectedCountry === code) return 0.02;
            return getCountryStatus(code) ? 0.012 : 0.004;
          }}
          polygonLabel={(d) => getCountryName(d as CountryFeature)}
          polygonsTransitionDuration={200}
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.02}
          pointRadius={0.35}
          pointLabel={(d) => (d as CityEntry).name}
          pointsTransitionDuration={200}
          rendererConfig={{
            antialias: true,
            alpha: true,
          }}
        />
      ) : (
        <div className="text-muted-foreground text-sm">Loading globe…</div>
      )}
    </div>
  );
};
