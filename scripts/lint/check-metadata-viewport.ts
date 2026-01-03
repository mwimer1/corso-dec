#!/usr/bin/env tsx
/**
 * Validates that Next.js metadata exports don't include viewport configuration.
 * 
 * Checks that page/layout files don't export viewport in metadata or generateMetadata,
 * and ensures not-found.tsx files don't export metadata at all. Viewport should be
 * configured at the root layout level only.
 * 
 * Intent: Enforce centralized viewport configuration
 * Files: Page, layout, template, loading, and not-found files in app directory
 * Invocation: pnpm lint:metadata-viewport
 */
import { findFiles } from './_utils';
import fs from "node:fs";
import { createLintResult, normalizePath } from './_utils';

function main() {
  const result = createLintResult();
  const files = findFiles(["app/**/{page,layout,template,loading,not-found}.tsx"]);
  
  for (const f of files) {
    const s = fs.readFileSync(f, "utf8");
    // Extract metadata object body conservatively and check within it
    const metaMatch = s.match(/export\s+const\s+metadata\s*=\s*\{([\s\S]*?)\}\s*;?/m);
    const constMetaHasViewport = !!(metaMatch && metaMatch[1] && /\bviewport\s*:/.test(metaMatch[1] ?? ""));
    // Extract generateMetadata return object and check within it
    const genMatch = s.match(/export\s+(?:async\s+)?function\s+generateMetadata\s*\([^)]*\)\s*\{[\s\S]*?return\s*\{([\s\S]*?)\}\s*;?[\s\S]*?\}/m);
    const genMetaHasViewport = !!(genMatch && genMatch[1] && /\bviewport\s*:/.test(genMatch[1] ?? ""));
    const normalizedPath = normalizePath(f);
    const isNotFound = /[\\/]not-found\.tsx$/.test(normalizedPath);
    // not-found must not export metadata/viewport at all
    const notFoundHasMetaOrViewport = isNotFound && (
      /export\s+const\s+metadata\s*=/.test(s) ||
      /export\s+function\s+generateMetadata/.test(s) ||
      /export\s+const\s+viewport\s*=/.test(s) ||
      /export\s+function\s+generateViewport/.test(s)
    );

    if (constMetaHasViewport || genMetaHasViewport || notFoundHasMetaOrViewport) {
      result.addError(normalizePath(f));
    }
  }
  
  // Preserve original output format
  if (result.hasErrors()) {
    console.error(
      "Viewport must not live under metadata. Move it to `export const viewport` or `generateViewport()`.",
    );
    for (const error of result.getErrors()) {
      console.error(" - " + error);
    }
    process.exitCode = 1;
  }
}

main();



