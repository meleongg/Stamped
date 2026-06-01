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

/**
 * Natural Earth SCALERANK: cartographic importance at 1:10m (lower = more prominent).
 *   0–2  megacities / world capitals
 *   3–5  primary cities (Paris, Osaka, Denver, …)
 *   6    secondary cities (Nice, Toulouse, Edinburgh, Yokohama, …)
 *   7+   smaller towns — excluded to keep search usable
 */
const MAX_SCALERANK_PRIMARY = 5;
const MAX_SCALERANK_SECONDARY = 6;

/** ISO_A2 on place rows that need manual parent country (overseas / special territories). */
const PLACE_ISO_A2_OVERRIDES = {
  GF: { countryCode: "250", countryName: "France" },
  GP: { countryCode: "250", countryName: "France" },
  MQ: { countryCode: "250", countryName: "France" },
  RE: { countryCode: "250", countryName: "France" },
  YT: { countryCode: "250", countryName: "France" },
  SJ: { countryCode: "578", countryName: "Norway" },
};

const normalizeCountryCode = (code) => {
  const trimmed = String(code).trim();
  if (!trimmed || /^-/.test(trimmed)) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  return trimmed.padStart(3, "0");
};

const pickIsoA2 = (props) => {
  for (const key of ["ISO_A2", "ISO_A2_EH", "WB_A2", "FIPS_10"]) {
    const value = props[key];
    if (value && value !== "-99") return value;
  }
  return null;
};

const pickIsoNumeric = (props) => {
  for (const key of ["ISO_N3", "ISO_N3_EH", "UN_A3"]) {
    const value = normalizeCountryCode(props[key]);
    if (value) return value;
  }
  return null;
};

const registerA2 = (a2, numeric, name, maps) => {
  if (!a2 || a2 === "-99" || !numeric || !name) return;
  if (!maps.a2ToNumeric.has(a2)) {
    maps.a2ToNumeric.set(a2, numeric);
    maps.a2ToName.set(a2, name);
  }
};

function buildCountryMaps(countriesGeo) {
  const a2ToNumeric = new Map();
  const a2ToName = new Map();
  const a3ToNumeric = new Map();
  const a3ToName = new Map();
  const numericToName = new Map();
  const maps = { a2ToNumeric, a2ToName, a3ToNumeric, a3ToName, numericToName };

  for (const f of countriesGeo.features) {
    const p = f.properties;
    const numeric = pickIsoNumeric(p);
    const name = p.ADMIN || p.NAME || p.NAME_LONG;
    if (!numeric || !name) continue;

    numericToName.set(numeric, name);

    const primaryA2 = pickIsoA2(p);
    registerA2(primaryA2, numeric, name, maps);

    // e.g. Taiwan admin ISO_A2=CN-TW but populated places use ISO_A2=TW (ISO_A2_EH)
    if (p.ISO_A2_EH && p.ISO_A2_EH !== primaryA2) {
      registerA2(p.ISO_A2_EH, numeric, name, maps);
    }

    for (const key of [
      "ADM0_A3",
      "BRK_A3",
      "GU_A3",
      "SU_A3",
      "ISO_A3_EH",
      "ADM0_A3_US",
    ]) {
      const a3 = p[key];
      if (!a3 || a3 === "-99") continue;
      if (!a3ToNumeric.has(a3)) {
        a3ToNumeric.set(a3, numeric);
        a3ToName.set(a3, name);
      }
    }
  }

  return maps;
}

function shouldInclude(props) {
  if (props.FEATURECLA === "Admin-0 capital") return true;
  const rank = Number(props.SCALERANK);
  return Number.isFinite(rank) && rank <= MAX_SCALERANK_SECONDARY;
}

function resolveCountry(p, maps) {
  const isoA2 = p.ISO_A2;
  if (isoA2 && isoA2 !== "-99") {
    const override = PLACE_ISO_A2_OVERRIDES[isoA2];
    if (override) return override;

    const fromA2 = maps.a2ToNumeric.get(isoA2);
    const nameA2 = maps.a2ToName.get(isoA2);
    if (fromA2 && nameA2) {
      return { countryCode: fromA2, countryName: nameA2 };
    }
  }

  const adm0A3 = p.ADM0_A3;
  if (adm0A3 && adm0A3 !== "-99") {
    const fromA3 = maps.a3ToNumeric.get(adm0A3);
    const nameA3 = maps.a3ToName.get(adm0A3);
    if (fromA3 && nameA3) {
      return { countryCode: fromA3, countryName: nameA3 };
    }
  }

  return null;
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
  const maps = buildCountryMaps(countries);

  const cities = [];
  const dropped = { noIso: 0, noMap: 0, filtered: 0, duplicate: 0 };
  const unmappedSamples = new Map();

  const seenIds = new Set();

  for (const f of places.features) {
    const p = f.properties;
    if (!shouldInclude(p)) {
      dropped.filtered++;
      continue;
    }

    const country = resolveCountry(p, maps);
    if (!country) {
      if (!p.ISO_A2 || p.ISO_A2 === "-99") {
        dropped.noIso++;
      } else {
        dropped.noMap++;
        const key = `${p.ISO_A2}|${p.ADM0_A3}|${p.ADM0NAME}`;
        if (!unmappedSamples.has(key)) {
          unmappedSamples.set(key, p.NAME);
        }
      }
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
      countryCode: country.countryCode,
      countryName: country.countryName,
      lat: Number(p.LATITUDE),
      lng: Number(p.LONGITUDE),
      scalerank: Number(p.SCALERANK),
      featurecla: p.FEATURECLA,
    });
  }

  cities.sort((a, b) => a.name.localeCompare(b.name));

  const countryNames = Object.fromEntries(
    [...maps.numericToName.entries()].sort(([a], [b]) => a.localeCompare(b)),
  );

  const meta = {
    source: "Natural Earth Populated Places (ne_10m_populated_places)",
    sourceUrl:
      "https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/",
    version: "5.1.2",
    filter: `Admin-0 capital OR SCALERANK <= ${MAX_SCALERANK_SECONDARY} (primary <= ${MAX_SCALERANK_PRIMARY}, secondary = ${MAX_SCALERANK_SECONDARY})`,
    generatedAt: new Date().toISOString(),
    count: cities.length,
    dropped,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(
    OUT,
    JSON.stringify({ meta, countryNames, cities }, null, 0),
  );

  console.log(`Wrote ${cities.length} cities to ${OUT}`);
  console.log(`Country names: ${Object.keys(countryNames).length}`);
  console.log("Dropped:", dropped);

  if (unmappedSamples.size > 0) {
    console.warn("\nUnmapped places (included by rank but no country code):");
    for (const [key, name] of unmappedSamples) {
      console.warn(`  ${name} (${key})`);
    }
  }

  if (dropped.noIso > 0) {
    console.warn(
      `\n${dropped.noIso} place(s) lack ISO_A2 (disputed territories — expected).`,
    );
  }
}

main();
