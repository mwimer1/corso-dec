// styles/fonts.ts - Google Fonts (Inter) configuration with performance optimizations
import { Inter } from 'next/font/google';

/**
 * Inter Variable Font - From Google Fonts with performance optimizations
 *
 * Benefits:
 * - Modern SaaS-standard font with excellent readability
 * - Supports real font weights (400, 500, 600, 700) - no synthetic weights
 * - Crisp rendering on Windows and macOS
 * - Reliable font delivery from Google's CDN
 * - Next.js automatic optimization and subsetting
 * - Better Core Web Vitals scores
 * - Reduced FOUT (Flash of Unstyled Text)
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700'],
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
});

/**
 * CSS variable for Inter font
 * Use this in CSS/Tailwind configuration
 */
export const interVariable = inter.variable;


