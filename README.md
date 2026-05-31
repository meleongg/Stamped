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

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Dev server with Turbopack                  |
| `npm run build`        | Production build                           |
| `npm run start`        | Serve the production build                 |
| `npm run lint`         | ESLint (flat config)                       |
| `npm run format`       | Format every file with Prettier            |
| `npm run format:check` | Check formatting without writing (CI mode) |

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
public/              Static assets + bundled TopoJSON world data
```

## Attribution

- Country boundaries and names from [Natural Earth](https://www.naturalearthdata.com/) (Admin 0 – Countries), packaged as TopoJSON via [world-atlas](https://github.com/topojson/world-atlas) (ISC License © 2013-2019 Michael Bostock)
- City names and locations from [Natural Earth Populated Places](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/) (10m cultural vectors), filtered to capitals and major cities and bundled locally
- Icons from [Lucide](https://lucide.dev), ISC License

Map boundaries, country labels, and city locations reflect Natural Earth’s cartographic choices, not a political position by Stamped.

To regenerate the city catalog after updating source data: `npm run build:cities`
