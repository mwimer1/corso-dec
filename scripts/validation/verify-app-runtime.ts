import { globby } from "globby";
import { readFileSync } from "node:fs";

async function main() {
  const errors: string[] = [];

  const apiRoutes = await globby(["app/api/**/route.ts"], { gitignore: true });
  for (const file of apiRoutes) {
    const src = readFileSync(file, "utf8");
    const hasRuntime = /\bexport\s+const\s+runtime\s*=\s*["'](edge|nodejs)["']/.test(src);
    if (!hasRuntime) errors.push(`${file}: missing export const runtime`);
  }

  const privateBarrels = await globby(["app/**/_components/index.ts"], { gitignore: true });
  for (const file of privateBarrels) {
    errors.push(`${file}: private barrel not allowed in route-private _components`);
  }

  if (errors.length) {
    console.error("verify-app-runtime failed:\n" + errors.map(e => ` - ${e}`).join("\n"));
    process.exit(1);
  }
  console.log("verify-app-runtime: OK");
}

main().catch((e) => { console.error(e); process.exit(1); });



