import type { FeatureCollection, Geometry, Position } from "geojson";

function extendRingBounds(
  ring: Position[],
  acc: { west: number; south: number; east: number; north: number },
) {
  for (const pt of ring) {
    const lng = pt[0];
    const lat = pt[1];
    if (lng < acc.west) acc.west = lng;
    if (lng > acc.east) acc.east = lng;
    if (lat < acc.south) acc.south = lat;
    if (lat > acc.north) acc.north = lat;
  }
}

function extendGeometryBounds(geom: Geometry, acc: { west: number; south: number; east: number; north: number }) {
  if (geom.type === "Polygon") {
    for (const ring of geom.coordinates) {
      extendRingBounds(ring, acc);
    }
  } else if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      for (const ring of poly) {
        extendRingBounds(ring, acc);
      }
    }
  }
}

/** Web Mercator / `fitBounds` order: southwest corner, northeast corner. */
export function featureCollectionLngLatBounds(
  fc: FeatureCollection,
): [[number, number], [number, number]] {
  const acc = {
    west: Infinity,
    south: Infinity,
    east: -Infinity,
    north: -Infinity,
  };
  for (const f of fc.features) {
    if (f.geometry) extendGeometryBounds(f.geometry, acc);
  }
  if (!Number.isFinite(acc.west)) {
    return [
      [-109.1, 36.9],
      [-102.0, 41.1],
    ];
  }
  return [
    [acc.west, acc.south],
    [acc.east, acc.north],
  ];
}

/** Expand bounds around center by `factor` (e.g. 1.08 shows a bit of neighboring states). */
export function expandLngLatBounds(
  bounds: [[number, number], [number, number]],
  factor: number,
): [[number, number], [number, number]] {
  const [[w, s], [e, n]] = bounds;
  const cx = (w + e) / 2;
  const cy = (s + n) / 2;
  const hw = ((e - w) * factor) / 2;
  const hh = ((n - s) * factor) / 2;
  return [
    [cx - hw, cy - hh],
    [cx + hw, cy + hh],
  ];
}
