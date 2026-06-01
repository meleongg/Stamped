# Stamped

A personal world travel map. Mark the countries you've been to, share your map with a link, and compare it side-by-side with a friend's. No login, no backend — your data stays in your browser.

## Features

- Click countries to mark them **visited / planning / want-to-visit**
- Per-country **notes and visit dates** in a side panel
- **Shareable links** with server-rendered OG image previews for iMessage, Twitter, Discord, etc.
- **Side-by-side comparison** with a friend's map (overlap, gaps, "add their places to my list")
- **Country search** with `Cmd`/`Ctrl + K`, focuses + zooms the map to the result
- Light and dark mode, fully responsive
- Local-first: everything is stored in `localStorage`; no account, no tracking beyond anonymous usage analytics

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Scripts

| Command                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Dev server with Turbopack                       |
| `npm run build`        | Production build                                |
| `npm run start`        | Serve the production build                      |
| `npm run lint`         | ESLint (flat config)                            |
| `npm run format`       | Format every file with Prettier                 |
| `npm run format:check` | Check formatting without writing (CI mode)      |
| `npm run build:cities` | Rebuild city catalog from Natural Earth sources |

## Stack

- [Next.js](https://nextjs.org) 15 (App Router) deployed on [Vercel](https://vercel.com)
- [React](https://react.dev) 19 + [TypeScript](https://www.typescriptlang.org)
- [D3](https://d3js.org) (`d3-geo`, `d3-zoom`) for the interactive map
- [TopoJSON](https://github.com/topojson/topojson) world data, bundled locally for SSR-safe rendering
- [Tailwind CSS](https://tailwindcss.com) 4 + [shadcn/ui](https://ui.shadcn.com) primitives
- [Lucide](https://lucide.dev) icons, [Sonner](https://sonner.emilkowal.ski) toasts, [react-day-picker](https://daypicker.dev) for the visit-date picker

## How sharing works (without a backend)

Sharing is **fully client-side**. When you generate a link, your map data is encoded into a compact format (`USA-v,CAN-w,…`), prefixed with a version + your display name, and base64url-packed into the URL path:

```
/m/<base64url-encoded payload>
```

The receiving page (a Next.js Server Component) decodes this on every request and:

1. Renders the **read-only map** with the encoded statuses
2. Generates a **dynamic OG image** via [`opengraph-image.tsx`](app/m/[data]/opengraph-image.tsx) + `@vercel/og`, so social previews show actual stats and a map render
3. Offers a **"Compare with my map"** CTA — `/compare/[them]` overlays the visitor's `localStorage` data with the shared map and shows overlap, gaps, and a one-tap "add their places to my want-to-visit list"

No data ever leaves the URL bar. Notes and visit dates stay on the original device.

## Project structure

```
app/
├── components/      UI primitives + composed components (MapView, NoteSidebar, CountrySearch, ...)
├── compare/[them]/  Compare-with-a-friend route
├── m/[data]/        Read-only shared map viewer + dynamic OG image
├── hooks/           Custom hooks (useMapData)
├── utils/           Pure utilities (geo, share encoding, stats, storage)
├── constants/       Status palette, continents, dimensions
└── contexts/        Theme provider
components/ui/       shadcn-generated primitives
public/
├── world-atlas/     Bundled TopoJSON country boundaries (countries-110m.json)
└── cities/          Generated city catalog (populated-places.json)
scripts/
├── build-city-catalog.mjs   Builds public/cities/populated-places.json
└── sources/                 Natural Earth GeoJSON inputs (not required at runtime)
```

## Attribution

- Country boundaries and names from [Natural Earth](https://www.naturalearthdata.com/) (Admin 0 – Countries), packaged as TopoJSON via [world-atlas](https://github.com/topojson/world-atlas) (ISC License © 2013-2019 Michael Bostock)
- City names and locations from [Natural Earth Populated Places](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/) (10m cultural vectors), filtered to capitals and major cities and bundled locally
- Icons from [Lucide](https://lucide.dev), ISC License

Map boundaries, country labels, and city locations reflect Natural Earth’s cartographic choices, not a political position by Stamped.

## Updating countries & cities

Map geometry and city search both come from **bundled static files**, not a live API. When Natural Earth or world-atlas releases updates (or you want to change which cities are included), refresh the data locally and commit the regenerated assets.

### Countries (map polygons)

**Source:** [world-atlas `countries-110m`](https://github.com/topojson/world-atlas) (TopoJSON, ~177 countries at 110m resolution).

**File:** `public/world-atlas/countries-110m.json`

**Steps:**

1. Download or build a new `countries-110m.json` from [world-atlas](https://github.com/topojson/world-atlas) (or convert from a newer Natural Earth Admin 0 shapefile using [topojson](https://github.com/topojson/topojson)).
2. Replace `public/world-atlas/countries-110m.json`.
3. If new ISO numeric codes appear, add them to the continent buckets in [`app/constants/continents.ts`](app/constants/continents.ts) so stats (“continents visited”) stay correct.
4. Run `npm run build` and smoke-test: click countries, search (`Cmd/Ctrl+K`), share links, compare view, OG image.

**Note:** The 110m map omits many small states and territories (e.g. Singapore, Monaco, Hong Kong as separate polygons). City pins for those places still work; only country-level clicking is limited.

### Cities (search, pins, country names)

**Sources** (place in `scripts/sources/`):

- `ne_10m_populated_places.geojson` — [Natural Earth Populated Places](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/) (10m)
- `ne_10m_admin_0_countries.geojson` — [Natural Earth Admin 0 – Countries](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) (10m)

**Output:** `public/cities/populated-places.json` (generated; do not edit by hand)

**Steps:**

1. Download fresh GeoJSON from Natural Earth (or the [natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) repo) into `scripts/sources/` with the filenames above.
2. Run:

   ```bash
   npm run build:cities
   ```

   This rebuilds the catalog with:
   - Zero-padded ISO numeric `countryCode` values (aligned with the map)
   - `countryName` on each city and a top-level `countryNames` lookup (for places missing from the 110m map)

3. Adjust filters in [`scripts/build-city-catalog.mjs`](scripts/build-city-catalog.mjs) if needed (default: Admin-0 capitals + primary cities `SCALERANK <= 5` + secondary `SCALERANK = 6`).
4. Commit **both** any source updates under `scripts/sources/` (if you version them) and the regenerated `public/cities/populated-places.json`.
5. Run `npm run build` and test: city search, stamp/unstamp, country sidebar city picker, share/compare with cities, zoom-to-pin.

### Share links & stored user data

| Change                                   | What to do                                                                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **New cities / country name fixes only** | Regenerate catalog (`build:cities`); existing share links and `localStorage` maps keep working.                                                                                                                           |
| **Country codes change** (rare)          | Users’ saved maps may point at old codes; consider a one-time migration in [`app/utils/storage.ts`](app/utils/storage.ts) or bump share format (below).                                                                   |
| **Breaking share payload**               | Increment `SHARE_FORMAT_VERSION` in [`app/utils/share.ts`](app/utils/share.ts) and add a decode path for older versions if you still want old links to work. Old links without a decoder will show “unsupported version”. |

User maps and notes live in the browser (`localStorage`); refreshing Natural Earth data does **not** migrate or delete user data automatically.

### Quick checklist after any data refresh

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Spot-check a large country, a microstate city (e.g. Singapore), and a shared link
- [ ] Confirm search shows country **names**, not numeric codes
