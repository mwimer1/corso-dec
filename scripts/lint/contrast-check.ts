#!/usr/bin/env tsx
/*
 * FILE: scripts/contrast-check.ts
 *
 * Description: Ensures all color combinations in the design system meet WCAG 2.1 AA contrast ratios.
 *
 * Usage:
 *
 * pnpm run a11y:contrast
 */
import chroma from 'chroma-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import path from 'path';
import postcss from 'postcss';

interface Color {
  name: string;
  value: string;
}

const contrastPairs = {
  light: [
    { foreground: '--foreground', background: '--background' },
    { foreground: '--muted-foreground', background: '--background' },
    { foreground: '--primary-foreground', background: '--primary' },
    { foreground: '--secondary-foreground', background: '--secondary' },
    { foreground: '--success-foreground', background: '--success' },
    { foreground: '--warning-foreground', background: '--warning' },
    { foreground: '--danger-foreground', background: '--danger' },
  ],
  dark: [
    { foreground: '--foreground', background: '--background' },
    { foreground: '--muted-foreground', background: '--background' },
    { foreground: '--primary-foreground', background: '--primary' },
    { foreground: '--secondary-foreground', background: '--secondary' },
    { foreground: '--success-foreground', background: '--success' },
    { foreground: '--warning-foreground', background: '--warning' },
    { foreground: '--danger-foreground', background: '--danger' },
  ],
};

function parseColors(css: string, themeSelector: string): Color[] {
  const root = postcss.parse(css);
  const colors: Color[] = [];

  root.walkRules(themeSelector, (rule) => {
    rule.walkDecls(/^--/, (decl) => {
      colors.push({ name: decl.prop, value: decl.value });
    });
  });

  return colors;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkContrast() {
  const css = readFileSync(
    path.join(process.cwd(), 'styles/tokens/colors.css'),
    'utf8',
  );

  const lightThemeColors = parseColors(css, ':root');
  const darkThemeColors = [
    ...lightThemeColors,
    ...parseColors(css, '@media (prefers-color-scheme: dark)'),
  ];

  const themes = {
    light: lightThemeColors,
    dark: darkThemeColors,
  };

  let failed = false;

  for (const [themeName, pairs] of Object.entries(contrastPairs)) {
    console.log(`\nChecking ${themeName} theme...`);

    const themeColors = themes[themeName as keyof typeof themes];

    for (const { foreground, background } of pairs) {
      const fgColor = themeColors.find((c) => c.name === foreground);
      const bgColor = themeColors.find((c) => c.name === background);

      if (!fgColor || !bgColor) {
        console.error(`Could not find color values for ${foreground} or ${background}`);
        failed = true;
        continue;
      }

      const fg = `hsl(${fgColor.value})`;
      const bg = `hsl(${bgColor.value})`;

      const contrast = chroma.contrast(fg, bg);

      if (contrast < 4.5) {
        console.error(
          `❌ Contrast check failed for ${foreground} on ${background}: ${contrast.toFixed(2)}`,
        );
        failed = true;
      } else {
        console.log(
          `✅ Contrast check passed for ${foreground} on ${background}: ${contrast.toFixed(2)}`,
        );
      }
    }
  }

  if (failed) {
    console.error('\nContrast checks failed.');
    process.exitCode = 1;
  } else {
    console.log('\nAll contrast checks passed.');
  }
}

checkContrast(); 

