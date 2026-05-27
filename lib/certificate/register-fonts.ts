import { Font } from "@react-pdf/renderer";

let fontsRegistered = false;

function fontUrl(filename: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/fonts/${filename}`;
  }
  return `/fonts/${filename}`;
}

export function registerCertificateFonts() {
  if (fontsRegistered) return;
  Font.register({
    family: "JetBrainsMono",
    fonts: [
      { src: fontUrl("JetBrainsMono-Regular.ttf"), fontWeight: 400 },
      { src: fontUrl("JetBrainsMono-Bold.ttf"), fontWeight: 700 },
    ],
  });
  fontsRegistered = true;
}

export const CERTIFICATE_FONT_FAMILY = "JetBrainsMono";
