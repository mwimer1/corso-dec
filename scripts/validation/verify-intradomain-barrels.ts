#!/usr/bin/env ts-node
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
    console.error("verify:no-intradomain-root-barrels failed:\n" + errors.map(e => ` - ${e}`).join("\n"));
    process.exit(1);
  }
  console.log("verify:no-intradomain-root-barrels: OK");
}

main().catch((e) => { console.error(e); process.exit(1); });



