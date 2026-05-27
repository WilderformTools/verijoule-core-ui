# Colorado wind and solar markers on the map

This document describes how wind and solar facility coordinates flow from CSV into the map UI, and how the MapLibre basemap is configured.

## Data source

- **File:** `CO SUN WIND OUTPUT.csv` (repository root)
- **Columns:** `Plant_Code`, `Latitude`, `Longitude`, `Energy_Source_1`
- **Plant codes:** ignored for rendering; only lat, lng, and source matter.
- **`Energy_Source_1`:** `SUN` (solar) or `WND` (wind). The build script normalizes with trim and uppercase so lowercase variants still work.

## Generated module (CSV → TypeScript)

We do **not** load the CSV at runtime in the browser. A small Node script converts the CSV into a typed TypeScript module.

1. **Script:** `scripts/build-co-plants.mjs`  
   - Reads `CO SUN WIND OUTPUT.csv`  
   - Writes `lib/co-energy-plants.ts` exporting `CO_ENERGY_PLANTS` as `{ lat, lng, kind: 'sun' | 'wnd' }[]`

2. **Regenerate after CSV changes:**

   ```bash
   npm run build:co-plants
   ```

   Commit the updated `lib/co-energy-plants.ts` along with any CSV edits.

## MapLibre map (`MapContainer`)

The map is **Colorado-only** in framing: initial `fitBounds` uses the Colorado boundary GeoJSON with a slight expansion so neighboring states peek at the edges. **`maxBounds`** keeps panning roughly in the Rockies. Geography (roads, land, water) comes from a **vector tile basemap**; Colorado outline and plants are **GeoJSON layers** on top.

- **Style URL:** `NEXT_PUBLIC_MAPLIBRE_STYLE_URL` in `.env.local` (see [`.env.example`](../.env.example)). If unset, the default is **Carto Dark Matter** (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`) — no API key, suitable for a dark brutalist look.
- **Brutalist overlays:** semi-transparent `#111111` fill over Colorado, **white** outline (`#ffffff`), **white** solar circles and wind **X** icon (canvas-generated PNG, `map.addImage`).
- **Caption:** `STATE: COLORADO-EIA-PSCO` under the map, centered, `font-mono`.
- **Frame:** the map canvas sits in a **`4:3`** box (`aspect-[4/3]`). A **single-row grid** (`grid-rows-[minmax(0,1fr)]`, `place-items-stretch`) fills the flex height budget; **`place-items-center` is avoided** because it shrink-wraps the grid item vertically, so `max-h-full` was resolving against ~195px even when the cell was ~392px tall. The map frame sits in a **`flex h-full … items-center justify-center`** shell and uses **`h-full max-h-full w-auto`** so height tracks the cell (minus letterboxing via centering) and width follows 4:3, clamped with `max-w-[min(100%,min(96vw,56rem))]`. On **`sm+`**, the home page uses `sm:min-h-[min(45dvh,560px)]` and tighter padding so the map gets a fair share of **`dvh`** under `overflow-hidden`. **Below `sm`**, the page scrolls normally on short phones.

### Plant layers

- Coordinates are **`[longitude, latitude]`** in GeoJSON (CSV lists lat then lon — the generator and map both use lng/lat order for GeoJSON).
- **Solar:** `circle` layer, `kind === 'sun'`.
- **Wind:** `symbol` layer with runtime `wind-x` image, `kind === 'wnd'`.

## Bounding box helper

[`lib/geo-bbox.ts`](../lib/geo-bbox.ts) computes `[[west, south], [east, north]]` from `COLORADO_STATE_GEOJSON` and expands bounds for `fitBounds` / `maxBounds`.

## Alternative: runtime CSV fetch

If you ever need to swap the file without rebuilding:

- Put a copy under `public/` (URL-safe filename).
- Fetch and parse in the client (add loading state).

## Files involved

| Role | Path |
|------|------|
| Source CSV | `CO SUN WIND OUTPUT.csv` |
| Build script | `scripts/build-co-plants.mjs` |
| Generated data | `lib/co-energy-plants.ts` |
| Map UI | `components/MapContainer.tsx` |
| State boundary | `lib/verijoule-map-data.ts` (`COLORADO_STATE_GEOJSON`) |
| BBox helpers | `lib/geo-bbox.ts` |
| MapLibre control chrome | `app/globals.css` (`.maplibregl-ctrl-attrib`) |
