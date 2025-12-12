#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const specPath = path.resolve("api/openapi.yml");
const doc: any = YAML.parse(fs.readFileSync(specPath, "utf8"));

const isPublic = (op: any) => op?.["x-public"] === true;
const hasBearer = (op: any) => Array.isArray(op?.security) && op.security.some((s: any) => Object.keys(s || {}).includes("bearerAuth"));
const hasOrg = (op: any) => Array.isArray(op?.parameters) && op.parameters.some((p: any) => p?.$ref === "#/components/parameters/OrgIdHeader");

for (const p of Object.keys(doc.paths || {})) {
  const pathItem = doc.paths[p] || {};
  for (const m of ["get", "post", "put", "patch", "delete", "options", "head"]) {
    const op = pathItem[m];
    if (!op || isPublic(op) || !hasBearer(op) || hasOrg(op)) continue;
    op.parameters = op.parameters ?? [];
    op.parameters.push({ $ref: "#/components/parameters/OrgIdHeader" });
    pathItem[m] = op;
  }
  doc.paths[p] = pathItem;
}

fs.writeFileSync(specPath, YAML.stringify(doc), "utf8");
console.log("Injected OrgIdHeader where required.");



