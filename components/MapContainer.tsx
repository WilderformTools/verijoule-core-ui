"use client";

import type { FeatureCollection } from "geojson";
import type { LngLatBoundsLike, Map as MaplibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { TerminalPanel } from "@/components/TerminalPanel";
import { CO_ENERGY_PLANTS } from "@/lib/co-energy-plants";
import { expandLngLatBounds, featureCollectionLngLatBounds } from "@/lib/geo-bbox";
import {
  MAP_ICON_SOLAR,
  MAP_ICON_WIND,
  solarPlantIconBitmap,
  solarPlantIconDataUrl,
  windPlantIconBitmap,
  windPlantIconDataUrl,
} from "@/lib/map-plant-icons";
import { COLORADO_STATE_GEOJSON } from "@/lib/verijoule-map-data";

/** Dark vector basemap (no key). Override with `NEXT_PUBLIC_MAPLIBRE_STYLE_URL`. */
const DEFAULT_MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Fallback if the default style fails to load (e.g. network). */
const FALLBACK_MAP_STYLE = "https://demotiles.maplibre.org/style.json";

const CO_FILL = "#111111";
const CO_FILL_OPACITY = 0.42;
const STROKE_WHITE = "#ffffff";
const PLANT_ICON_SIZE = 0.18;
const FIT_BOUNDS_PADDING = { top: 52, right: 44, bottom: 52, left: 44 };

const PLANTS_GEOJSON: FeatureCollection = {
  type: "FeatureCollection",
  features: CO_ENERGY_PLANTS.map((p, i) => ({
    type: "Feature",
    id: i,
    properties: { kind: p.kind },
    geometry: {
      type: "Point",
      coordinates: [p.lng, p.lat],
    },
  })),
};

const PLANT_SYMBOL_LAYOUT = {
  "icon-size": PLANT_ICON_SIZE,
  "icon-allow-overlap": true,
  "icon-ignore-placement": true,
} as const;

const LEGEND_ICON_PX = 16;

const MAP_LEGEND_ITEMS = [
  {
    label: "Solar",
    iconSrc: solarPlantIconDataUrl(LEGEND_ICON_PX),
  },
  {
    label: "Wind",
    iconSrc: windPlantIconDataUrl(LEGEND_ICON_PX),
  },
] as const;

/** Run `cb` once the element has a real layout size (MapLibre needs non-zero box at init). */
function waitForNonZeroSize(el: HTMLElement, cb: () => void): () => void {
  let done = false;
  let raf = 0;

  const tryRun = () => {
    if (done) return;
    const { width, height } = el.getBoundingClientRect();
    if (width >= 32 && height >= 32) {
      done = true;
      cb();
      return;
    }
    raf = requestAnimationFrame(tryRun);
  };

  const ro = new ResizeObserver(() => {
    tryRun();
  });
  ro.observe(el);
  tryRun();

  return () => {
    done = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
  };
}

export type MapContainerProps = {
  className?: string;
};

export function MapContainer({ className }: MapContainerProps) {
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const fitBoundsRef = useRef<LngLatBoundsLike | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const resetMapView = useCallback(() => {
    const m = mapRef.current;
    const bounds = fitBoundsRef.current;
    if (!m || !bounds) return;
    m.fitBounds(bounds, {
      padding: FIT_BOUNDS_PADDING,
      maxZoom: 10.5,
      duration: 450,
    });
  }, []);

  useLayoutEffect(() => {
    const el = mapElRef.current;
    if (!el) return;

    const styleUrl =
      process.env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL?.trim() || DEFAULT_MAP_STYLE;

    const coBounds = featureCollectionLngLatBounds(COLORADO_STATE_GEOJSON);
    const fitBounds = expandLngLatBounds(coBounds, 1.16);
    const maxBounds = expandLngLatBounds(coBounds, 1.42);
    fitBoundsRef.current = fitBounds;

    let cancelled = false;
    let map: MaplibreMap | null = null;
    let roMap: ResizeObserver | null = null;
    let resizeRaf = 0;
    let styleFallbackUsed = false;
    let bootStarted = false;

    const fitMapToPanel = (m: MaplibreMap) => {
      try {
        m.fitBounds(fitBounds, {
          padding: FIT_BOUNDS_PADDING,
          duration: 0,
          maxZoom: 10.5,
        });
      } catch (e) {
        console.error("[MapContainer] fitBounds failed", e);
      }
    };

    const scheduleRefit = (m: MaplibreMap) => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = requestAnimationFrame(() => {
          if (cancelled) return;
          m.resize();
          fitMapToPanel(m);
        });
      });
    };

    const setupLayers = async (m: MaplibreMap) => {
      if (cancelled) return;

      m.resize();
      fitMapToPanel(m);

      if (!m.getSource("co-boundary")) {
        m.addSource("co-boundary", {
          type: "geojson",
          data: COLORADO_STATE_GEOJSON as FeatureCollection,
        });
      }

      if (!m.getLayer("co-fill")) {
        m.addLayer({
          id: "co-fill",
          type: "fill",
          source: "co-boundary",
          paint: {
            "fill-color": CO_FILL,
            "fill-opacity": CO_FILL_OPACITY,
          },
        });
      }

      if (!m.getLayer("co-outline")) {
        m.addLayer({
          id: "co-outline",
          type: "line",
          source: "co-boundary",
          paint: {
            "line-color": STROKE_WHITE,
            "line-width": 2,
          },
        });
      }

      if (!m.getSource("plants")) {
        m.addSource("plants", {
          type: "geojson",
          data: PLANTS_GEOJSON,
        });
      }

      const plantIcons: {
        id: string;
        kind: "sun" | "wnd";
        load: () => Promise<ImageBitmap>;
      }[] = [
          { id: MAP_ICON_SOLAR, kind: "sun", load: solarPlantIconBitmap },
          { id: MAP_ICON_WIND, kind: "wnd", load: windPlantIconBitmap },
        ];

      for (const { id, kind, load } of plantIcons) {
        if (cancelled) return;
        try {
          const bitmap = await load();
          if (cancelled) return;
          if (m.hasImage(id)) {
            m.updateImage(id, bitmap);
          } else {
            m.addImage(id, bitmap);
          }
          const layerId = kind === "sun" ? "plants-sun" : "plants-wnd";
          if (!m.getLayer(layerId)) {
            m.addLayer({
              id: layerId,
              type: "symbol",
              source: "plants",
              filter: ["==", ["get", "kind"], kind],
              layout: {
                ...PLANT_SYMBOL_LAYOUT,
                "icon-image": id,
              },
            });
          }
        } catch (e) {
          console.error("[MapContainer] plant icon failed", id, e);
        }
      }
    };

    const onMapLoad = (m: MaplibreMap) => {
      if (cancelled) return;
      void setupLayers(m);
    };

    const boot = async () => {
      if (cancelled || bootStarted) return;
      bootStarted = true;
      const maplibregl = (await import("maplibre-gl")).default;
      if (cancelled) return;

      map = new maplibregl.Map({
        container: el,
        style: styleUrl,
        bounds: fitBounds,
        fitBoundsOptions: {
          padding: FIT_BOUNDS_PADDING,
          maxZoom: 10.5,
        },
        maxBounds,
        attributionControl: false,
        maplibreLogo: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
      });
      mapRef.current = map;

      map.on("error", (e) => {
        console.error("[MapContainer]", e);
        if (
          !cancelled &&
          !styleFallbackUsed &&
          styleUrl !== FALLBACK_MAP_STYLE &&
          map
        ) {
          styleFallbackUsed = true;
          try {
            map.setStyle(FALLBACK_MAP_STYLE);
          } catch (err) {
            console.error("[MapContainer] setStyle fallback failed", err);
          }
        }
      });

      map.once("load", () => {
        if (map) {
          onMapLoad(map);
          if (!cancelled) setMapReady(true);
        }
      });

      map.once("idle", () => {
        if (map && !cancelled) scheduleRefit(map);
      });

      map.on("style.load", () => {
        if (cancelled || !map) return;
        if (styleFallbackUsed) {
          void setupLayers(map);
        }
      });

      roMap = new ResizeObserver(() => {
        if (!map) return;
        scheduleRefit(map);
      });
      roMap.observe(el);
      scheduleRefit(map);
    };

    const disposeWait = waitForNonZeroSize(el, () => {
      void boot();
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      cancelAnimationFrame(resizeRaf);
      disposeWait?.();
      roMap?.disconnect();
      if (map) {
        map.remove();
        map = null;
      }
      mapRef.current = null;
    };
  }, []);

  return (
    <TerminalPanel
      title="State:Colorado-EIA"
      className={className}
      contentClassName="min-h-0 p-0"
    >
      <div className="relative h-full w-full flex-1">
        <div
          ref={mapElRef}
          className="h-full w-full overflow-hidden rounded-none bg-[#0a0a0a]"
          role="presentation"
          aria-label="Colorado map with energy facilities"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 p-2">
          <div
            className="pointer-events-auto border border-[#3d3d3d] bg-[#050505]/90 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#cccccc]"
            role="group"
            aria-label="Map legend"
          >
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {MAP_LEGEND_ITEMS.map(({ label, iconSrc }) => (
                <li key={label} className="flex items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- data URL matches MapLibre plant icons */}
                  <img
                    src={iconSrc}
                    alt=""
                    width={LEGEND_ICON_PX}
                    height={LEGEND_ICON_PX}
                    className="shrink-0"
                  />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={resetMapView}
            disabled={!mapReady}
            className="pointer-events-auto border border-[#3d3d3d] bg-[#050505]/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#050505]/90 disabled:hover:text-white"
            aria-label="Reset map view"
          >
            Reset
          </button>
        </div>
      </div>
    </TerminalPanel>
  );
}
