// scripts/openapi/openapi-guard-rbac.ts
// Validates OpenAPI spec for RBAC compliance and tenant isolation
import fs from "node:fs";
import path from "node:path";

type HttpMethod = "get"|"put"|"post"|"patch"|"delete"|"options"|"head"|"trace";

const SPEC_JSON = path.resolve("api/openapi.json");
const ROLES_PATH = path.resolve("config/security/rbac-roles.json");
const ALLOWED_ROLES = new Set<string>(JSON.parse(fs.readFileSync(ROLES_PATH, "utf8")));
const REQUIRE_TENANT_HEADER = true; // enforce X-Corso-Org-Id for bearer-auth routes

const spec = JSON.parse(fs.readFileSync(SPEC_JSON, "utf8"));
const methods: HttpMethod[] = ["get","put","post","patch","delete","options","head","trace"];
const errors: string[] = [];

function hasBearer(op: any): boolean {
  const sec = op.security ?? spec.security ?? [];
  return Array.isArray(sec) && sec.some((s: any) => s && Object.hasOwn(s, "bearerAuth"));
}
function isPublic(op: any): boolean {
  return op["x-public"] === true;
}
function isPersonalScope(op: any): boolean {
  return op["x-corso-personal-scope"] === true;
}
function hasOrgHeader(op: any, pathItem: any): boolean {
  const allParams = [...(pathItem?.parameters ?? []), ...(op.parameters ?? [])];
  return allParams.some((p: any) => {
    // Check for required OrgIdHeader (not optional)
    if (p?.$ref) {
      const isRequired = String(p.$ref).endsWith("#/components/parameters/OrgIdHeader");
      // Also check if parameter itself is marked as required: true (non-optional)
      const isParamRequired = p.required === true;
      return isRequired && (isParamRequired !== false); // Default to true if not specified
    }
    return p?.in === "header" && p?.name === "X-Corso-Org-Id" && p?.required !== false;
  });
}
function hasOptionalOrgHeader(op: any, pathItem: any): boolean {
  const allParams = [...(pathItem?.parameters ?? []), ...(op.parameters ?? [])];
  return allParams.some((p: any) => {
    // Check for optional OrgIdHeaderOptional or optional OrgIdHeader
    if (p?.$ref) {
      return String(p.$ref).endsWith("#/components/parameters/OrgIdHeaderOptional") ||
             (String(p.$ref).endsWith("#/components/parameters/OrgIdHeader") && p.required === false);
    }
    return p?.in === "header" && p?.name === "X-Corso-Org-Id" && p?.required === false;
  });
}

for (const p of Object.keys(spec.paths ?? {})) {
  const pathItem = (spec.paths as any)[p];
  for (const m of methods) {
    const op = pathItem?.[m];
    if (!op) continue;

    if (hasBearer(op) && !isPublic(op)) {
      const rbac = op["x-corso-rbac"] ?? op["x-rbac"];
      if (!Array.isArray(rbac) || rbac.length === 0) {
        errors.push(`${m.toUpperCase()} ${p}: missing x-corso-rbac (or x-rbac) while bearerAuth is required`);
      } else {
        for (const role of rbac) {
          if (!ALLOWED_ROLES.has(String(role))) {
            errors.push(`${m.toUpperCase()} ${p}: invalid role "${role}" (allowed: ${[...ALLOWED_ROLES].join(", ")})`);
          }
        }
      }
      // Personal-scope routes can have optional org header (not required)
      // Non-personal-scope routes require org header (if REQUIRE_TENANT_HEADER is true)
      if (REQUIRE_TENANT_HEADER && !isPersonalScope(op)) {
        if (!hasOrgHeader(op, pathItem)) {
          // Allow optional org header for personal-scope routes
          const hasOptional = hasOptionalOrgHeader(op, pathItem);
          if (!hasOptional) {
            errors.push(`${m.toUpperCase()} ${p}: bearerAuth route missing required OrgIdHeader parameter (use OrgIdHeaderOptional for personal-scope routes)`);
          }
        }
      }
      // Personal-scope routes should use optional header if they include org header
      if (isPersonalScope(op) && hasOrgHeader(op, pathItem) && !hasOptionalOrgHeader(op, pathItem)) {
        errors.push(`${m.toUpperCase()} ${p}: personal-scope route should use OrgIdHeaderOptional (not required OrgIdHeader)`);
      }
    }
  }
}

if (errors.length) {
  console.error("OpenAPI RBAC guard failed:\n" + errors.map(e => ` - ${e}`).join("\n"));
  process.exit(1);
}
console.log("OpenAPI RBAC guard: OK");



