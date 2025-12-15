#!/usr/bin/env tsx
/**
 * @fileoverview Intradomain Root Barrel Import Validator
 * @description Prevents circular dependencies by detecting when domain index files import their own root barrel.
 * 
 * This script is typically invoked via: pnpm audit:barrels --only intradomain
 * Direct usage: tsx scripts/validation/verify-intradomain-barrels.ts
 */

import { globby } from "globby";
import { readFileSync } from "node:fs";
import { dirname, posix } from "node:path";

async function main() {
  const errors: string[] = [];
  const aliasRoots = [
    ["lib", "@/lib/"],
    ["components", "@/components/"],
    ["types", "@/types/"],
  ] as const;

  const domainIndexes = await globby([
    "lib/*/index.ts",
    "components/*/index.ts",
    "types/*/index.ts",
  ], { gitignore: true });

  for (const file of domainIndexes) {
    const src = readFileSync(file, "utf8");
    const dir = dirname(file).split(posix.sep).pop()!;
    const lines = src.split("\n");

    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("import ")) continue;
      const m = line.match(/from\s+['"]([^'"]+)['"]/);
      if (!m) continue;
      const spec = m[1];
      if (!spec || spec.startsWith("./") || spec.startsWith("../")) continue;
      for (const [root, alias] of aliasRoots) {
        if (file.startsWith(`${root}/`)) {
          if (spec === `${alias}${dir}` || spec.startsWith(`${alias}${dir}/`)) {
            errors.push(`${file}: imports its own domain root barrel (${spec}) -> avoid cycles`);
          }
        }
      }
    }
  }

  if (errors.length) {
    console.error("Intradomain root barrel check failed:\n" + errors.map(e => ` - ${e}`).join("\n"));
    console.error("\n💡 Run 'pnpm audit:barrels --only intradomain' to see this check in context.");
    process.exit(1);
  }
  console.log("✅ Intradomain root barrel check passed");
}

main().catch((e) => { console.error(e); process.exit(1); });



