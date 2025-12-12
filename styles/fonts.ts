// styles/fonts.ts - Google Fonts (Lato) configuration with performance optimizations
import { Lato } from 'next/font/google';

/**
 * Lato Variable Font - From Google Fonts with performance optimizations
 *
 * Benefits:
 * - Reliable font delivery from Google's CDN
 * - Next.js automatic optimization and subsetting
 * - Better Core Web Vitals scores
 * - Reduced FOUT (Flash of Unstyled Text)
 * - No Git LFS or local file issues
 */
const lato = Lato({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  weight: ['400', '700'],
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
 * CSS variable for Lato font
 * Use this in CSS/Tailwind configuration
 */
export const latoVariable = lato.variable;


