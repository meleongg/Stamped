/**
 * Build public/cities/populated-places.json from Natural Earth Populated Places.
 * Source: ne_10m_populated_places + ne_10m_admin_0_countries (nvkelso/natural-earth-vector)
 * Run: node scripts/build-city-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SOURCES = path.join(__dirname, "sources");
const OUT = path.join(ROOT, "public/cities/populated-places.json");

const PLACES_PATH = path.join(SOURCES, "ne_10m_populated_places.geojson");
const COUNTRIES_PATH = path.join(SOURCES, "ne_10m_admin_0_countries.geojson");

/** Admin-0 capitals + SCALERANK <= 5 (~1,140 major places). */
const MAX_SCALERANK = 5;

function buildIsoA2ToNumeric(countriesGeo) {
  const map = new Map();
  for (const f of countriesGeo.features) {
    const p = f.properties;
    const a2 = p.ISO_A2;
    const n3 = p.ISO_N3;
    if (!a2 || a2 === "-99" || !n3 || n3 === "-99") continue;
    const numeric = String(Number(n3));
    if (numeric === "NaN") continue;
    map.set(a2, numeric);
  }
  return map;
}

function shouldInclude(props) {
  if (props.FEATURECLA === "Admin-0 capital") return true;
  const rank = Number(props.SCALERANK);
  return Number.isFinite(rank) && rank <= MAX_SCALERANK;
}

function main() {
  if (!fs.existsSync(PLACES_PATH) || !fs.existsSync(COUNTRIES_PATH)) {
    console.error(
      "Missing source GeoJSON. Download into scripts/sources/:\n" +
        "  ne_10m_populated_places.geojson\n" +
        "  ne_10m_admin_0_countries.geojson",
    );
    process.exit(1);
  }

  const places = JSON.parse(fs.readFileSync(PLACES_PATH, "utf8"));
  const countries = JSON.parse(fs.readFileSync(COUNTRIES_PATH, "utf8"));
  const isoA2ToNumeric = buildIsoA2ToNumeric(countries);

  const cities = [];
  const dropped = { noIso: 0, noMap: 0, filtered: 0, duplicate: 0 };
  const seenIds = new Set();

  for (const f of places.features) {
    const p = f.properties;
    if (!shouldInclude(p)) {
      dropped.filtered++;
      continue;
    }

    const isoA2 = p.ISO_A2;
    if (!isoA2 || isoA2 === "-99") {
      dropped.noIso++;
      continue;
    }

    const countryCode = isoA2ToNumeric.get(isoA2);
    if (!countryCode) {
      dropped.noMap++;
      continue;
    }

    const id = String(p.NE_ID);
    if (seenIds.has(id)) {
      dropped.duplicate++;
      continue;
    }
    seenIds.add(id);

    cities.push({
      id,
      name: p.NAME || p.NAMEASCII,
      countryCode,
      lat: Number(p.LATITUDE),
      lng: Number(p.LONGITUDE),
      scalerank: Number(p.SCALERANK),
      featurecla: p.FEATURECLA,
    });
  }

  cities.sort((a, b) => a.name.localeCompare(b.name));

  const meta = {
    source: "Natural Earth Populated Places (ne_10m_populated_places)",
    sourceUrl:
      "https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/",
    version: "5.1.2",
    filter: `Admin-0 capital OR SCALERANK <= ${MAX_SCALERANK}`,
    generatedAt: new Date().toISOString(),
    count: cities.length,
    dropped,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ meta, cities }, null, 0));

  console.log(`Wrote ${cities.length} cities to ${OUT}`);
  console.log("Dropped:", dropped);
}

main();
