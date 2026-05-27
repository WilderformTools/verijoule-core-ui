import type { Feature, FeatureCollection } from "geojson";

import coloradoStateRaw from "./colorado-state.json";

/**
 * Colorado state boundary (US Census–style polygon).
 * Geometry: glynnbird/usstatesgeojson (https://github.com/glynnbird/usstatesgeojson).
 */
export const COLORADO_STATE_GEOJSON: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: coloradoStateRaw.properties,
      geometry: coloradoStateRaw.geometry,
    } as Feature,
  ],
};
