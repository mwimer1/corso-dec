import fs from "fs";
import path from "path";

function fail(msg: string) {
  console.error("PARITY CHECK FAILED:", msg);
  process.exit(2);
}

async function main() {
  const root = process.cwd();

  // Check that .agent indexes exist
  const agentDir = path.join(root, ".agent");
  const expected = ["routes.index.json", "aliases.index.json", "barrels.index.json"];
  for (const e of expected) {
    if (!fs.existsSync(path.join(agentDir, e))) {
      fail(`${e} missing in .agent`);
    }
  }

  // Check docs exist
  const openapi = path.join(root, "docs", "api", "openapi.yaml");
  if (!fs.existsSync(openapi)) fail("docs/api/openapi.yaml missing");

  const envMd = path.join(root, "docs", "reference", "env.md");
  if (!fs.existsSync(envMd)) fail("docs/reference/env.md missing");

  console.log("Parity checks passed (basic)");
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});



