import { ImageResponse } from "next/og";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { STATUS_COLORS } from "@/app/constants";
import { MapData, TravelStatus } from "@/app/types";
import { loadCountries } from "@/app/utils/geo";
import { InvalidShareLinkError, decodeMap } from "@/app/utils/share";
import { computeStats } from "@/app/utils/stats";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Travel map";

const MAP_WIDTH = 1200;
const MAP_HEIGHT = 520;
const HEADER_HEIGHT = 110;

const STATUS_LABELS_SHORT: Record<TravelStatus, string> = {
  visited: "visited",
  planning: "planning",
  want_to_visit: "want to visit",
  avoid: "avoid",
};

interface RouteParams {
  data: string;
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { data: encoded } = await params;

  let name = "Travel";
  let statusByCountry: Record<string, TravelStatus> = {};
  let mapData: MapData = {};

  try {
    const decoded = decodeMap(encoded);
    name = decoded.name;
    mapData = decoded.data;
    statusByCountry = Object.fromEntries(
      Object.entries(mapData).map(([code, entry]) => [code, entry.status]),
    );
  } catch (error) {
    if (!(error instanceof InvalidShareLinkError)) {
      console.error("OG decode error:", error);
    }
  }

  const stats = computeStats(mapData);

  const countries = loadCountries();

  const projection = geoNaturalEarth1()
    .scale(220)
    .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2 + 10]);

  const path = geoPath(projection);

  const paths = countries
    .map((country) => {
      const d = path(country);
      if (!d) return null;
      const code = String(country.id);
      const status = statusByCountry[code];
      const fill = status ? STATUS_COLORS[status] : "#e0e7ff";
      return { d, fill, code };
    })
    .filter(Boolean) as Array<{ d: string; fill: string; code: string }>;

  const statsLine =
    stats.totalMarked === 0
      ? "Track your travels on a world map"
      : [
          `${stats.visitedCount} visited`,
          stats.visitedPercent > 0
            ? `${stats.visitedPercent}% of the world`
            : null,
          stats.continentsCount > 0
            ? `${stats.continentsCount} / ${stats.totalContinents} continents`
            : null,
        ]
          .filter(Boolean)
          .join("  ·  ");

  const subStatusLine = (
    ["planning", "want_to_visit", "avoid"] as TravelStatus[]
  )
    .filter((s) => (stats.byStatus[s] || 0) > 0)
    .map((s) => `${stats.byStatus[s]} ${STATUS_LABELS_SHORT[s]}`)
    .join("  ·  ");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          height: HEADER_HEIGHT,
          paddingLeft: 48,
          paddingRight: 48,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            fontSize: 38,
            fontWeight: 700,
            lineHeight: 1.1,
            display: "flex",
          }}
        >
          {name}&apos;s travel map
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#cbd5e1",
            marginTop: 4,
            display: "flex",
          }}
        >
          {statsLine}
        </div>
        {subStatusLine && (
          <div
            style={{
              fontSize: 16,
              color: "#94a3b8",
              marginTop: 2,
              display: "flex",
            }}
          >
            {subStatusLine}
          </div>
        )}
      </div>
      <div
        style={{
          position: "relative",
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
          display: "flex",
          backgroundColor: "#dbeafe",
        }}
      >
        <svg
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          {paths.map((p, i) => (
            <path
              key={i}
              d={p.d}
              fill={p.fill}
              stroke="#475569"
              strokeWidth={0.4}
            />
          ))}
        </svg>
      </div>
    </div>,
    {
      ...size,
      headers: {
        "cache-control": "public, immutable, no-transform, max-age=31536000",
      },
    },
  );
}
