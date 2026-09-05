import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Syne } from "next/font/google";
import type { ReactNode } from "react";

import GlassLens from "@/components/GlassLens";
import LensFilter from "@/components/LensFilter";

import "./globals.css";

const syne = Syne({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-syne" });
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-plex",
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Alloy",
  description: "A strict superset of Luau that compiles to plain Luau, line for line.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${plex.variable} ${mono.variable}`}>
      <body>
        <LensFilter />
        <GlassLens />
        {children}
      </body>
    </html>
  );
}
