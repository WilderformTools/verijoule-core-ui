"use client";

import type { FeatureCollection } from "geojson";
import type { Map as MaplibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useLayoutEffect, useRef } from "react";

import { TerminalPanel } from "@/components/TerminalPanel";
import { CO_ENERGY_PLANTS } from "@/lib/co-energy-plants";
import { expandLngLatBounds, featureCollectionLngLatBounds } from "@/lib/geo-bbox";
import { COLORADO_STATE_GEOJSON } from "@/lib/verijoule-map-data";

/** Dark vector basemap (no key). Override with `NEXT_PUBLIC_MAPLIBRE_STYLE_URL`. */
const DEFAULT_MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Fallback if the default style fails to load (e.g. network). */
const FALLBACK_MAP_STYLE = "https://demotiles.maplibre.org/style.json";

const CO_FILL = "#111111";
const CO_FILL_OPACITY = 0.42;
const STROKE_WHITE = "#ffffff";
const PLANT_SUN_RADIUS_PX = 3.25;
const WIND_ICON_CANVAS_PX = 48;
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

function windXDataUrl(size: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const pad = Math.max(2, size * 0.18);
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = STROKE_WHITE;
  ctx.lineWidth = Math.max(1.5, size / 10);
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(size - pad, size - pad);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(size - pad, pad);
  ctx.lineTo(pad, size - pad);
  ctx.stroke();
  return canvas.toDataURL("image/png");
}

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

  useLayoutEffect(() => {
    const el = mapElRef.current;
    if (!el) return;

    const styleUrl =
      process.env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL?.trim() || DEFAULT_MAP_STYLE;

    const coBounds = featureCollectionLngLatBounds(COLORADO_STATE_GEOJSON);
    const fitBounds = expandLngLatBounds(coBounds, 1.16);
    const maxBounds = expandLngLatBounds(coBounds, 1.42);

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

      if (!m.getLayer("plants-sun")) {
        m.addLayer({
          id: "plants-sun",
          type: "circle",
          source: "plants",
          filter: ["==", ["get", "kind"], "sun"],
          paint: {
            "circle-radius": PLANT_SUN_RADIUS_PX,
            "circle-color": STROKE_WHITE,
            "circle-opacity": 1,
          },
        });
      }

      const dataUrl = windXDataUrl(WIND_ICON_CANVAS_PX);
      if (dataUrl && !cancelled) {
        try {
          const { data } = await m.loadImage(dataUrl);
          if (cancelled) return;
          if (!m.hasImage("wind-x")) {
            m.addImage("wind-x", data);
          }
          if (!m.getLayer("plants-wnd")) {
            m.addLayer({
              id: "plants-wnd",
              type: "symbol",
              source: "plants",
              filter: ["==", ["get", "kind"], "wnd"],
              layout: {
                "icon-image": "wind-x",
                "icon-size": 0.5,
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
              },
            });
          }
        } catch {
          /* wind markers optional if image load fails */
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
        if (map) onMapLoad(map);
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
      cancelAnimationFrame(resizeRaf);
      disposeWait?.();
      roMap?.disconnect();
      if (map) {
        map.remove();
        map = null;
      }
    };
  }, []);

  return (
    <TerminalPanel
      title="State:Colorado-EIA"
      className={className}
      contentClassName="min-h-0 p-0"
    >
      <div
        ref={mapElRef}
        className="h-full w-full flex-1 overflow-hidden rounded-none bg-[#0a0a0a]"
        role="presentation"
        aria-label="Colorado map with energy facilities"
      />
    </TerminalPanel>
  );
}
