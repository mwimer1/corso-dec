import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT_MARKERS = ["package.json", "next.config.ts", "next.config.mjs"];

function repoRoot(start = process.cwd()): string {
  let dir = start;
  for (let i = 0; i < 5; i++) {
    if (ROOT_MARKERS.some((m) => fs.existsSync(path.join(dir, m)))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

export function resolveRouteModule(segment: string): string | null {
  // segment examples: 'chat/generate-sql', 'subscription/status', 'dashboard/query'
  const root = repoRoot();
  const candidates = [
    path.join(root, "app", "api", "v1", segment, "route.ts"),
    path.join(root, "app", "api", "v1", segment, "route.tsx"),
    path.join(root, "src", "app", "api", "v1", segment, "route.ts"),
    path.join(root, "src", "app", "api", "v1", segment, "route.tsx"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return pathToFileURL(p).href;
  }
  return null;
}



