import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

/**
 * The popescuportfolio type system, self-hosted via next/font:
 * Archivo (body + display) · IBM Plex Mono (kickers, metadata) ·
 * Source Serif 4 italic (the voice).
 *
 * This replaces two hand-rolled @font-face blocks that pointed at
 * versioned fonts.gstatic.com URLs — render-blocking third-party
 * requests against filenames that rot silently.
 *
 * RA-1: there is no `Archivo_Expanded` export in next/font/google — the
 * family does not exist in Google's registry (only Archivo, Archivo
 * Black, Archivo Narrow). Archivo itself is variable on wdth 62..125 and
 * wght 100..900, so the expanded display cut is the SAME typeface at
 * wdth 125. One loader, both jobs: `axes: ["wdth"]` opens the width axis
 * (weight must be omitted — next/font only accepts `axes` when the
 * weight is variable), and the display face is selected in globals.css
 * with `font-stretch: 125%`.
 */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AuditLens — UX Evaluation Engine",
  description:
    "Senior-grade UX audits from screenshots or written concepts. Every report is complete, or says that it isn't.",
  icons: {
    icon: "/motifs/north-star.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${ibmPlexMono.variable} ${sourceSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
