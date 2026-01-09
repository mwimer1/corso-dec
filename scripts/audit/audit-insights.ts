// scripts/audit/audit-insights.ts
// Audit script for Insights mock CMS data validation
//
// Validates content conventions and structure for Insights mock CMS data:
// - Schema validation (Zod)
// - Content HTML checks (h1, img alt, heading IDs)
// - Category validation (slug references)
// - Key takeaways constraints
//
// Usage:
//   pnpm audit:insights
//
// Exit codes:
//   0 = Pass (no errors, warnings allowed)
//   1 = Fail (errors found)
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

const MOCKCMS_ROOT = join(process.cwd(), 'public', '__mockcms__');
const INSIGHTS_DIR = join(MOCKCMS_ROOT, 'insights');
const CATEGORIES_DIR = join(MOCKCMS_ROOT, 'categories');

// Reuse schemas from mockcms-adapter
const CategorySchema = z
  .object({
    slug: z.string(),
    name: z.string(),
  })
  .strict();

const InsightPreviewSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    description: z.string().optional(),
    publishDate: z.string().optional(),
    updatedDate: z.string().optional(),
    imageUrl: z.string().optional(),
    categories: z.array(CategorySchema).optional(),
    readingTime: z.number().optional(),
    author: z
      .object({
        name: z.string(),
        avatar: z.string().nullish(),
      })
      .strict()
      .optional(),
  })
  .strict();

const InsightItemSchema = InsightPreviewSchema.extend({
  content: z.string(),
  heroCaption: z.string().optional(),
  keyTakeaways: z
    .array(z.string().trim().min(1).max(300))
    .max(8)
    .optional()
    .refine(
      (arr) => !arr || arr.every((item) => !/<[^>]+>/.test(item)),
      { message: "keyTakeaways items must not contain HTML tags" }
    ),
}).strict();

interface AuditResult {
  file: string;
  errors: string[];
  warnings: string[];
}

async function auditInsightFile(filePath: string): Promise<AuditResult> {
  const result: AuditResult = {
    file: filePath,
    errors: [],
    warnings: [],
  };

  try {
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);

    // Determine if it's a preview (index.json) or item (individual file)
    const isIndex = filePath.endsWith('index.json');
    const schema = isIndex ? z.array(InsightPreviewSchema) : InsightItemSchema;

    // Validate schema
    const validation = schema.safeParse(parsed);
    if (!validation.success) {
      validation.error.errors.forEach((err) => {
        result.errors.push(`Schema validation: ${err.path.join('.')} - ${err.message}`);
      });
      return result;
    }

    // If it's an item file, check keyTakeaways constraints
    if (!isIndex && 'keyTakeaways' in parsed && parsed.keyTakeaways) {
      const keyTakeaways = parsed.keyTakeaways as string[];

      // Check array length
      if (keyTakeaways.length === 0) {
        result.warnings.push('keyTakeaways is empty array (should be omitted if empty)');
      } else if (keyTakeaways.length > 8) {
        result.errors.push(`keyTakeaways has ${keyTakeaways.length} items (max 8)`);
      }

      // Check each item
      keyTakeaways.forEach((item, index) => {
        const trimmed = item.trim();
        if (trimmed.length === 0) {
          result.errors.push(`keyTakeaways[${index}] is empty after trimming`);
        } else if (trimmed.length > 300) {
          result.errors.push(`keyTakeaways[${index}] exceeds 300 chars (${trimmed.length} chars)`);
        } else if (trimmed.length > 180) {
          result.warnings.push(`keyTakeaways[${index}] is long (${trimmed.length} chars, consider shortening)`);
        }

        // Check for HTML tags
        if (/<[^>]+>/.test(item)) {
          result.errors.push(`keyTakeaways[${index}] contains HTML tags`);
        }
      });

      // Check for duplicate "Key takeaways" section in HTML content
      if (parsed.content) {
        const content = parsed.content as string;
        const hasKeyTakeawaysSection = /<h2>Key\s+takeaways?<\/h2>/i.test(content);
        if (hasKeyTakeawaysSection) {
          result.warnings.push('keyTakeaways exists but HTML content also contains "Key takeaways" section (should be removed)');
        }

        // Content HTML validation checks
        // Fail if content contains <h1 (case-insensitive)
        if (/<h1\b/i.test(content)) {
          result.errors.push('Content contains <h1> tag (only h2-h6 should be used; h1 is reserved for page title)');
        }

        // Fail if any <img> is missing alt attribute
        const imgMatches = Array.from(content.matchAll(/<img\b[^>]*>/gi));
        const imagesWithoutAlt = imgMatches.filter((imgMatch) => {
          const imgTag = imgMatch[0];
          return !/alt\s*=/i.test(imgTag);
        });
        if (imagesWithoutAlt.length > 0) {
          result.errors.push(`Content contains ${imagesWithoutAlt.length} <img> tag(s) without alt attribute (accessibility requirement)`);
        }

        // Warn if <h2> or <h3> is missing id attribute (IDs are generated at render-time, but it's better if they exist)
        const headingMatches = Array.from(content.matchAll(/<(h2|h3)\b[^>]*>/gi));
        const headingsWithoutId = headingMatches.filter((headingMatch) => {
          const headingTag = headingMatch[0];
          return !/id\s*=/i.test(headingTag);
        });
        if (headingsWithoutId.length > 0) {
          const h2Count = headingsWithoutId.filter((m) => m[1]?.toLowerCase() === 'h2').length;
          const h3Count = headingsWithoutId.filter((m) => m[1]?.toLowerCase() === 'h3').length;
          const counts = [];
          if (h2Count > 0) counts.push(`${h2Count} <h2>`);
          if (h3Count > 0) counts.push(`${h3Count} <h3>`);
          result.warnings.push(`Content contains ${counts.join(' and ')} tag(s) without id attribute (IDs are generated at render-time, but explicit IDs are preferred for stability)`);
        }
      }

      // Warn if description contains < or > (likely unintended HTML)
      if (parsed.description) {
        const description = parsed.description as string;
        if (/[<>]/.test(description)) {
          result.warnings.push('Description contains < or > characters (likely unintended HTML - should be plain text)');
        }
      }
    }

    // If it's index.json, check consistency
    if (isIndex) {
      const items = parsed as Array<{ slug: string }>;
      for (const item of items) {
        const detailPath = join(INSIGHTS_DIR, `${item.slug}.json`);
        try {
          await readFile(detailPath, 'utf-8');
        } catch {
          result.warnings.push(`Index references ${item.slug}.json but file does not exist`);
        }
      }
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      result.errors.push(`JSON parse error: ${error.message}`);
    } else if (error instanceof Error) {
      result.errors.push(`File read error: ${error.message}`);
    } else {
      result.errors.push(`Unknown error: ${String(error)}`);
    }
  }

  return result;
}

async function loadCategories(): Promise<Set<string>> {
  try {
    const categoriesPath = join(CATEGORIES_DIR, 'index.json');
    const raw = await readFile(categoriesPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const validated = z.array(CategorySchema).parse(parsed);
    return new Set(validated.map((cat) => cat.slug));
  } catch (error) {
    console.warn('⚠️  Warning: Could not load categories index for validation');
    return new Set();
  }
}

async function main() {
  console.log('Auditing Insights mock CMS data...\n');

  // Load categories for validation
  const validCategorySlugs = await loadCategories();

  const files = await readdir(INSIGHTS_DIR);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  const results: AuditResult[] = [];

  for (const file of jsonFiles) {
    const filePath = join(INSIGHTS_DIR, file);
    const result = await auditInsightFile(filePath);

    // Category validation - check all referenced category slugs exist
    if (!filePath.endsWith('index.json')) {
      try {
        const raw = await readFile(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        
        if (parsed.categories && Array.isArray(parsed.categories)) {
          for (const cat of parsed.categories) {
            const slug = cat?.slug;
            if (slug && typeof slug === 'string' && validCategorySlugs.size > 0 && !validCategorySlugs.has(slug)) {
              result.errors.push(`Category slug "${slug}" does not exist in categories index`);
            }
          }
        }
      } catch {
        // Skip if file parsing failed (already reported above)
      }
    }

    results.push(result);
  }

  // Report results
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const result of results) {
    if (result.errors.length > 0 || result.warnings.length > 0) {
      console.log(`\n${result.file}:`);
      if (result.errors.length > 0) {
        console.log('  ERRORS:');
        result.errors.forEach((err) => console.log(`    - ${err}`));
        totalErrors += result.errors.length;
      }
      if (result.warnings.length > 0) {
        console.log('  WARNINGS:');
        result.warnings.forEach((warn) => console.log(`    - ${warn}`));
        totalWarnings += result.warnings.length;
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Files audited: ${results.length}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Total warnings: ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log('\n❌ Audit failed with errors');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log('\n⚠️  Audit passed with warnings');
    process.exit(0);
  } else {
    console.log('\n✅ Audit passed');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
