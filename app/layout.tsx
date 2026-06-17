import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import { Web3Providers } from "@/components/Web3Providers";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VeriJouleCore",
  description: "VeriJouleCore by Wilderform Tools: A technical proof of concept turning real-world energy generation data into verifiable on-chain state via Chainlink CRE.",
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
