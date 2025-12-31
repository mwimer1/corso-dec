// styles/fonts.ts - Google Fonts (Lato) configuration with performance optimizations
import { Lato } from "next/font/google";

/**
 * Lato Variable Font - From Google Fonts with performance optimizations
 *
 * Benefits:
 * - Modern SaaS-standard font with excellent readability
 * - Uses valid Lato weights from Google Fonts (no 500/600)
 * - Crisp rendering on Windows and macOS
 * - Reliable font delivery from Google's CDN
 * - Next.js automatic optimization and subsetting
 * - Better Core Web Vitals scores
 * - Reduced FOUT (Flash of Unstyled Text)
 */
const lato = Lato({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  // Lato supports: 100, 300, 400, 700, 900
  weight: ["100", "300", "400", "700", "900"],
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

/**
 * Primary CSS variable export for the app font
 * Use this in CSS/Tailwind configuration
 */
export const latoVariable = lato.variable;
