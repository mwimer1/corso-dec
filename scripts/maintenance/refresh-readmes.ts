import { globby } from "globby";
import { readFileSync, writeFileSync } from "node:fs";
import { inferLastUpdated, normalizeDate, parseMd, stringifyMd } from './_utils/frontmatter';

async function main() {
  // Include GitHub directory READMEs alongside other documentation
  // Treat them like test directory READMEs - no index barrels needed
  const files = await globby([
    // Primary docs
    "README.md",
    "docs/**/*.md",

    // App and product code areas
    "actions/**/README.md",
    "app/**/README.md",
    "lib/**/README.md",
    "types/**/README.md",
    "hooks/**/README.md",
    "components/**/README.md",
    "contexts/**/README.md",
    "styles/**/README.md",
    "scripts/**/README.md",
    "tests/**/README.md",
    "tools/**/README.md",
    "supabase/**/README.md",
    "config/**/README.md",
    "public/**/README.md",
    "stories/**/README.md",
    "eslint-plugin-corso/**/README.md",
    ".husky/**/README.md",

    // Repo meta
    ".github/**/README.md",
    ".vscode/**/README.md",
    ".husky/**/README.md",
    ".cursor/**/README.md",
  ], { gitignore: true });
  
  let refreshedCount = 0;
  let frontmatterCount = 0;
  
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const parsed = parseMd(src);
    const inferred = await inferLastUpdated(file, true);

    if (!parsed.hasFrontmatter) {
      const next = stringifyMd({ last_updated: inferred }, parsed.content);
      if (next !== src) {
        writeFileSync(file, next);
        refreshedCount++;
        console.log(`✅ Refreshed: ${file}`);
      }
      continue;
    }

    frontmatterCount++;
    const existing = normalizeDate(parsed.data?.['last_updated']);
    const chosen = existing && inferred ? (existing > inferred ? existing : inferred) : (existing ?? inferred);
    const next = stringifyMd({ ...parsed.data, last_updated: chosen }, parsed.content);
    if (next !== src) {
      writeFileSync(file, next);
      refreshedCount++;
      console.log(`✅ Refreshed: ${file}`);
    }
  }
  
  console.log(`\n📄 Matched ${files.length} README files`);
  console.log(`📝 With frontmatter: ${frontmatterCount}`);
  console.log(`🎉 Refreshed: ${refreshedCount}`);
}

main().catch((e) => { 
  console.error("❌ Script failed:", e); 
  process.exit(1); 
});



