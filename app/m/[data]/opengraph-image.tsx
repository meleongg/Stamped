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
export const alt = "Stamped travel map";

const MAP_WIDTH = 1200;
const HEADER_HEIGHT = 230;
const MAP_HEIGHT = size.height - HEADER_HEIGHT;

const STATUS_LABELS_SHORT: Record<TravelStatus, string> = {
  visited: "visited",
  planning: "planning",
  want_to_visit: "want to visit",
  avoid: "avoid",
};

const BRAND_HOST = "stamped-travel.vercel.app";

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
  let travelData = { countries: {} as MapData, cities: {} };

  try {
    const decoded = decodeMap(encoded);
    name = decoded.name;
    travelData = decoded.data;
    mapData = decoded.data.countries;
    statusByCountry = Object.fromEntries(
      Object.entries(mapData).map(([code, entry]) => [code, entry.status]),
    );
  } catch (error) {
    if (!(error instanceof InvalidShareLinkError)) {
      console.error("OG decode error:", error);
    }
  }

  const stats = computeStats(travelData);
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
      const fill = status ? STATUS_COLORS[status] : "#94a3b8";
      return { d, fill };
    })
    .filter(Boolean) as Array<{ d: string; fill: string }>;

  const statsLine =
    stats.totalMarked === 0
      ? "Mark the countries you've visited"
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
    .filter((s) => s !== "avoid" || (stats.byStatus.avoid || 0) > 0)
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
      {/* Header band */}
      <div
        style={{
          height: HEADER_HEIGHT,
          paddingLeft: 56,
          paddingRight: 56,
          paddingTop: 32,
          paddingBottom: 28,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0f172a",
          color: "#ffffff",
        }}
      >
        {/* Brand bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 52,
                height: 52,
                borderRadius: 10,
                backgroundColor: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width={28}
                height={28}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0f172a"
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13" />
                <path d="M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z" />
                <path d="M5 22h14" />
              </svg>
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                letterSpacing: -0.5,
                display: "flex",
              }}
            >
              Stamped
            </div>
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#94a3b8",
              display: "flex",
            }}
          >
            {BRAND_HOST}
          </div>
        </div>

        {/* Hero name + stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -0.5,
              display: "flex",
            }}
          >
            {name}&apos;s travel map
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div
              style={{
                fontSize: 22,
                color: "#cbd5e1",
                display: "flex",
              }}
            >
              {statsLine}
            </div>
            {subStatusLine && (
              <div
                style={{
                  fontSize: 18,
                  color: "#64748b",
                  display: "flex",
                }}
              >
                {subStatusLine}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div
        style={{
          position: "relative",
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
          display: "flex",
          backgroundColor: "#bfdbfe",
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
