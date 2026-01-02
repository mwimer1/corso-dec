#!/usr/bin/env tsx
import { globbySync } from "globby";
import fs from "node:fs";

const files = globbySync(["app/**/{page,layout,template,loading,not-found}.tsx"], { dot: false });
const offenders: string[] = [];
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  // Extract metadata object body conservatively and check within it
  const metaMatch = s.match(/export\s+const\s+metadata\s*=\s*\{([\s\S]*?)\}\s*;?/m);
  const constMetaHasViewport = !!(metaMatch && metaMatch[1] && /\bviewport\s*:/.test(metaMatch[1] ?? ""));
  // Extract generateMetadata return object and check within it
  const genMatch = s.match(/export\s+(?:async\s+)?function\s+generateMetadata\s*\([^)]*\)\s*\{[\s\S]*?return\s*\{([\s\S]*?)\}\s*;?[\s\S]*?\}/m);
  const genMetaHasViewport = !!(genMatch && genMatch[1] && /\bviewport\s*:/.test(genMatch[1] ?? ""));
  const isNotFound = /[\\/]not-found\.tsx$/.test(f);
  // not-found must not export metadata/viewport at all
  const notFoundHasMetaOrViewport = isNotFound && (
    /export\s+const\s+metadata\s*=/.test(s) ||
    /export\s+function\s+generateMetadata/.test(s) ||
    /export\s+const\s+viewport\s*=/.test(s) ||
    /export\s+function\s+generateViewport/.test(s)
  );

  if (constMetaHasViewport || genMetaHasViewport || notFoundHasMetaOrViewport) offenders.push(f);
}
function main() {
  if (offenders.length) {
    console.error(
      "Viewport must not live under metadata. Move it to `export const viewport` or `generateViewport()`.",
    );
    offenders.forEach((o) => console.error(" - " + o));
    process.exitCode = 1;
  }
}

main();



