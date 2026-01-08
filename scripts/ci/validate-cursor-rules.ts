// scripts/ci/validate-cursor-rules.ts
import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

// Moved schema here since it's only used in this script
const enforcementEnum = z.enum(["advise", "warn", "block"]);

const cursorRuleFrontmatterSchema = z.object({
  rule_id: z.string().min(1).regex(/^[a-z0-9][a-z0-9-]*$/),
  title: z.string().min(1),
  owners: z.array(z.string().min(1)).min(1),
  status: z.enum(["active", "draft", "deprecated"]),
  domains: z.array(z.string().min(1)).min(1),
  enforcement: enforcementEnum,
  alwaysApply: z.boolean(),
  globs: z.array(z.string().min(1)).optional(),        // required iff alwaysApply=true (enforced below)
  related_rules: z.array(z.string().min(1)).optional(),
  last_reviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // optional metadata
  tags: z.array(z.string().min(1)).optional(),
  summary: z.string().optional(),
}).strict();

const RULES_DIR = path.resolve(".cursor", "rules");

// treat these as *not* rules
const IGNORE = new Set(["_snippets.mdc", "README.md", "_index.json"]);
const IGNORE_DIRS = new Set(["templates"]);

type RuleMeta = {
  file: string;
  id: string;
  alwaysApply: boolean;
  globs?: string[];
  related?: string[];
};

const problems: string[] = [];
const rules: RuleMeta[] = [];

for (const entry of fs.readdirSync(RULES_DIR)) {
  const full = path.join(RULES_DIR, entry);
  const stat = fs.statSync(full);

  if (stat.isDirectory()) {
    if (IGNORE_DIRS.has(entry)) continue;
    // no subdirs for rules today — skip
    continue;
  }
  if (!entry.endsWith(".mdc")) continue;
  if (IGNORE.has(entry)) continue;

  const raw = fs.readFileSync(full, "utf8");
  const parsed = matter(raw);

  // Check for deprecated lib/services/entities references
  if (raw.includes('lib/services/entities') || raw.includes('@/lib/services/entities')) {
    problems.push(`${entry}: Contains deprecated 'lib/services/entities' reference. Use 'lib/entities' instead.`);
  }

  try {
    const fm = cursorRuleFrontmatterSchema.parse(parsed.data);

    if (fm.alwaysApply && (!fm.globs || fm.globs.length === 0)) {
      problems.push(`${entry}: alwaysApply=true requires non-empty globs[]`);
    }

    rules.push({
      file: entry,
      id: fm.rule_id,
      alwaysApply: fm.alwaysApply,
      globs: fm.globs || [],
      related: fm.related_rules || [],
    });
  } catch (e: any) {
    problems.push(`${entry}: ${e.message}`);
  }
}

// unique rule_id
const seen = new Map<string,string>();
for (const r of rules) {
  if (seen.has(r.id)) {
    problems.push(`Duplicate rule_id "${r.id}" in ${r.file} and ${seen.get(r.id)}`);
  } else {
    seen.set(r.id, r.file);
  }
}

// related_rules must exist
for (const r of rules) {
  if (r.related) {
    for (const rel of r.related) {
      if (!seen.has(rel)) {
        problems.push(`${r.file}: related_rules references missing rule_id "${rel}"`);
      }
    }
  }
}

// emit summary & nonzero exit on failure
if (problems.length) {
  console.error("❌ Cursor rules validation failed:");
  for (const p of problems) console.error(" -", p);
  process.exitCode = 1;
} else {
  console.log("✅ Cursor rules validation passed.");
}




