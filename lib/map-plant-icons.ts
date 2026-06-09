/** Brutalist plant markers for MapLibre — near-white with a subtle kind tint on dark basemaps. */

/** Warm off-white: a hint of sun orange without breaking the monochrome frame. */
const SOLAR_STROKE = "#ffe6d4";
/** Cool off-white: a hint of sky blue, still reads as light on `#0a0a0a` / dark matter. */
const WIND_STROKE = "#dceaf4";

/** Square hub + thick cardinal rays — reads as solar at small map sizes. */
const SOLAR_ICON_BODY = `
  <rect x="18" y="18" width="12" height="12" fill="${SOLAR_STROKE}"/>
  <rect x="22" y="3" width="4" height="11" fill="${SOLAR_STROKE}"/>
  <rect x="22" y="34" width="4" height="11" fill="${SOLAR_STROKE}"/>
  <rect x="3" y="22" width="11" height="4" fill="${SOLAR_STROKE}"/>
  <rect x="34" y="22" width="11" height="4" fill="${SOLAR_STROKE}"/>
  <rect x="8" y="8" width="4" height="9" fill="${SOLAR_STROKE}" transform="rotate(-45 10 12.5)"/>
  <rect x="36" y="8" width="4" height="9" fill="${SOLAR_STROKE}" transform="rotate(45 38 12.5)"/>
  <rect x="8" y="31" width="4" height="9" fill="${SOLAR_STROKE}" transform="rotate(45 10 35.5)"/>
  <rect x="36" y="31" width="4" height="9" fill="${SOLAR_STROKE}" transform="rotate(-45 38 35.5)"/>
`;

/** Hub, mast, and three square-ended blades at 120°. */
const WIND_ICON_BODY = `
  <rect x="21" y="30" width="6" height="14" fill="${WIND_STROKE}"/>
  <rect x="20" y="20" width="8" height="8" fill="${WIND_STROKE}"/>
  <line x1="24" y1="24" x2="24" y2="5" stroke="${WIND_STROKE}" stroke-width="4" stroke-linecap="square"/>
  <line x1="24" y1="24" x2="40.5" y2="33.5" stroke="${WIND_STROKE}" stroke-width="4" stroke-linecap="square"/>
  <line x1="24" y1="24" x2="7.5" y2="33.5" stroke="${WIND_STROKE}" stroke-width="4" stroke-linecap="square"/>
`;

export const PLANT_ICON_CANVAS_PX = 48;

export const MAP_ICON_SOLAR = "plant-solar";
export const MAP_ICON_WIND = "plant-wind";

function plantIconSvgDataUrl(body: string, pixelSize: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" viewBox="0 0 48 48">${body}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("plant icon image failed to load"));
    img.src = src;
  });
}

/**
 * MapLibre cannot reliably register SVG data URLs; rasterize to a bitmap first.
 */
export async function plantIconImageBitmap(
  body: string,
  pixelSize = PLANT_ICON_CANVAS_PX,
): Promise<ImageBitmap> {
  const svg = await loadHtmlImage(plantIconSvgDataUrl(body, pixelSize));
  const canvas = document.createElement("canvas");
  canvas.width = pixelSize;
  canvas.height = pixelSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("plant icon canvas 2d context unavailable");
  }
  ctx.clearRect(0, 0, pixelSize, pixelSize);
  ctx.drawImage(svg, 0, 0, pixelSize, pixelSize);
  return createImageBitmap(canvas);
}

export function solarPlantIconBitmap(
  pixelSize = PLANT_ICON_CANVAS_PX,
): Promise<ImageBitmap> {
  return plantIconImageBitmap(SOLAR_ICON_BODY, pixelSize);
}

export function windPlantIconBitmap(
  pixelSize = PLANT_ICON_CANVAS_PX,
): Promise<ImageBitmap> {
  return plantIconImageBitmap(WIND_ICON_BODY, pixelSize);
}

/** Inline SVG data URL for UI legend (MapLibre still needs the bitmap helpers above). */
export function solarPlantIconDataUrl(
  pixelSize = PLANT_ICON_CANVAS_PX,
): string {
  return plantIconSvgDataUrl(SOLAR_ICON_BODY, pixelSize);
}

export function windPlantIconDataUrl(
  pixelSize = PLANT_ICON_CANVAS_PX,
): string {
  return plantIconSvgDataUrl(WIND_ICON_BODY, pixelSize);
}
