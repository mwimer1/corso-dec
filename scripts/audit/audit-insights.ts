// scripts/audit/audit-insights.ts
// Audit script for Insights mock CMS data validation
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';

const MOCKCMS_ROOT = join(process.cwd(), 'public', '__mockcms__');
const INSIGHTS_DIR = join(MOCKCMS_ROOT, 'insights');

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

async function main() {
  console.log('Auditing Insights mock CMS data...\n');

  const files = await readdir(INSIGHTS_DIR);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  const results: AuditResult[] = [];

  for (const file of jsonFiles) {
    const filePath = join(INSIGHTS_DIR, file);
    const result = await auditInsightFile(filePath);
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
