import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import { Web3Providers } from "@/components/Web3Providers";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "VeriJoule Core",
  description: "Decentralized telemetry engine — Wilderform Tools LLC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body className="h-full overflow-x-auto overflow-y-hidden bg-black text-white rounded-none">
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  );
}
