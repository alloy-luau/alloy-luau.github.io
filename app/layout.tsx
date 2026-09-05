import type { Metadata, Viewport } from "next";
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

const SITE = "https://alloy-luau.github.io";
const TITLE = "Alloy · A strict superset of Luau";
const DESCRIPTION =
  "Alloy adds structs, enums, traits, pattern matching, safe access, async, typed remotes, and a strict checker to Luau, and compiles every file to plain Luau on the same lines. One binary, one language server, one VS Code extension.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: TITLE,
    template: "%s · Alloy",
  },
  description: DESCRIPTION,
  applicationName: "Alloy",
  keywords: [
    "Alloy",
    "Alloy language",
    "Luau",
    "Luau superset",
    "Luau compiler",
    "Luau types",
    "strict Luau",
    "Roblox",
    "Roblox scripting",
    "Roblox language",
    "Luau structs",
    "Luau enums",
    "Luau pattern matching",
    "Luau traits",
    "Luau async",
    "typed remotes",
    "Rojo",
    "luau-lsp",
    "language server",
    "VS Code extension",
    "compile to Luau",
    "line preserving compiler",
  ],
  authors: [{ name: "Alloy", url: SITE }],
  creator: "Alloy",
  publisher: "Alloy",
  category: "technology",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Alloy",
    locale: "en_US",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/alloy-embed-banner.png",
        width: 2400,
        height: 1260,
        alt: "Alloy: a strict superset of Luau that compiles to plain Luau, line for line",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/alloy-embed-banner.png"],
  },
  icons: {
    icon: [{ url: "/aly-symbol.png", type: "image/png" }],
    apple: [{ url: "/aly-symbol.png", sizes: "1024x1024", type: "image/png" }],
    shortcut: ["/aly-symbol.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

/** The embed color a link takes in Discord, Slack, and the like: the
 *  brand purple. */
export const viewport: Viewport = {
  themeColor: "#7a58e0",
  colorScheme: "dark",
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
