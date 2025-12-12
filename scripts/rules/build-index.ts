import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const ROOT = path.resolve(".cursor", "rules");
const OUT = path.join(ROOT, "_index.json");

const IGNORE = new Set(["_snippets.mdc", "README.md", "_index.json"]);
const IGNORE_DIRS = new Set(["templates"]);

const items: Array<{rule_id: string; file: string; title: string; status: string; last_reviewed: string; alwaysApply: boolean;}> = [];

for (const entry of fs.readdirSync(ROOT)) {
  const full = path.join(ROOT, entry);
  const stat = fs.statSync(full);

  if (stat.isDirectory()) {
    if (IGNORE_DIRS.has(entry)) continue;
    continue;
  }
  if (!entry.endsWith(".mdc")) continue;
  if (IGNORE.has(entry)) continue;

  const raw = fs.readFileSync(full, "utf8");
  const { data } = matter(raw);

  if (!data?.['rule_id']) continue;

  items.push({
    rule_id: data['rule_id'],
    file: entry,
    title: data['title'] ?? entry,
    status: data['status'] ?? "draft",
    last_reviewed: data['last_reviewed'] ?? "1970-01-01",
    alwaysApply: !!data['alwaysApply'],
  });
}

fs.writeFileSync(OUT, JSON.stringify({
  generated_at: new Date().toISOString(),
  count: items.length,
  rules: items.sort((a,b) => a.rule_id.localeCompare(b.rule_id)),
}, null, 2));

console.log(`✅ Wrote ${OUT} with ${items.length} rules`);

