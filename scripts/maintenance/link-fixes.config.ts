#!/usr/bin/env tsx
/**
 * scripts/maintenance/link-fixes.config.ts
 * -------------------------------------------------------------
 * Refactored link fixes configuration to eliminate duplication
 * Uses configuration-driven approach instead of hardcoded arrays
 */

// Minimal local fallbacks for missing utils
const FileSystemUtils = {
  readJsonFile: (p: string) => {
    try { return JSON.parse(require('fs').readFileSync(p, 'utf8')); } catch { return null; }
  },
  writeJsonFile: (p: string, obj: any) => require('fs').writeFileSync(p, JSON.stringify(obj, null, 2))
};
const LoggingUtils = {
  warn: (...a: unknown[]) => console.warn(...a),
  error: (...a: unknown[]) => console.error(...a),
  success: (...a: unknown[]) => console.log(...a)
};

// Load migrated fixes from JSON (fallback to inline list if missing)
let migratedFixes: LinkFixCategory[] = FileSystemUtils.readJsonFile('./scripts/maintenance/link-fixes-migrated.json') || [];
if (!migratedFixes || migratedFixes.length === 0) {
  LoggingUtils.warn('link-fixes-migrated.json missing or empty; using fallback fixes');
  migratedFixes = [
    { name: 'fallback-redirects', description: 'Common redirects', fixes: [
      { pattern: '../development-workflow.md', replacement: '../dev-environment.md', description: 'dev workflow -> dev environment' }
    ]}
  ];
}

export type LinkFix = { pattern: string; replacement: string; description: string };

export type LinkFixCategory = {
  name: string;
  description: string;
  fixes: LinkFix[];
};

// Re-export for backward compatibility
export type { LinkFixCategory as default };

/**
 * Builder functions for common link fix patterns
 */
export class LinkFixBuilders {
  static redirectToReadme(basePath: string, target: string, description: string): LinkFix {
    return {
      pattern: `${basePath}/README.md`,
      replacement: `${target}/README.md`,
      description
    };
  }

  static redirectToParentReadme(path: string, description: string): LinkFix {
    const parentPath = path.split('/').slice(0, -1).join('/');
    return {
      pattern: path,
      replacement: `${parentPath}/README.md`,
      description
    };
  }

  static simpleRedirect(from: string, to: string, description: string): LinkFix {
    return { pattern: from, replacement: to, description };
  }

  static selfReference(path: string, description: string): LinkFix {
    return { pattern: path, replacement: path, description };
  }
}

/**
 * Configuration for different categories of link fixes
 * Combines manually created categories with migrated fixes
 */
const LINK_FIX_CATEGORIES: LinkFixCategory[] = [
  // Manually created categories (high-priority, well-organized)
  {
    name: 'manual-documentation-redirects',
    description: 'Manually curated documentation redirects',
    fixes: [
      LinkFixBuilders.simpleRedirect('../development-workflow.md', '../dev-environment.md', 'Redirect development-workflow to dev-environment'),
      LinkFixBuilders.simpleRedirect('../quality-gates.md', '../ci/quality-gates.md', 'Redirect quality-gates to ci/quality-gates'),
      LinkFixBuilders.simpleRedirect('../codebase/scripts.md', '../scripts-vs-tools-guidelines.md', 'Redirect scripts to scripts-vs-tools-guidelines'),
      LinkFixBuilders.simpleRedirect('../codebase/tools.md', '../scripts-vs-tools-guidelines.md', 'Redirect tools to scripts-vs-tools-guidelines')
    ]
  },
  {
    name: 'manual-self-references',
    description: 'Manually curated self-referencing files',
    fixes: [
      LinkFixBuilders.selfReference('../../docs/contribution.md', 'Contribution doc exists, keep as is'),
      LinkFixBuilders.selfReference('../../lib/README.md', 'Lib README exists, keep as is'),
      LinkFixBuilders.selfReference('../../../styles/README.md', 'Styles README exists, keep as is')
    ]
  },
  // Migrated categories from the original file
  ...migratedFixes
];

/**
 * Generate all link fixes from configuration
 */
export function generateLinkFixes(): LinkFix[] {
  return LINK_FIX_CATEGORIES.flatMap(category =>
    category.fixes.map(fix => ({
      ...fix,
      category: category.name
    }))
  );
}

/**
 * Get link fixes by category
 */
export function getLinkFixesByCategory(categoryName: string): LinkFix[] {
  const category = LINK_FIX_CATEGORIES.find(cat => cat.name === categoryName);
  return category?.fixes || [];
}

/**
 * Legacy export for backward compatibility
 * TODO: Migrate consumers to use generateLinkFixes() instead
 */
export const COMMON_FIXES: LinkFix[] = generateLinkFixes();

/**
 * Utility functions for working with link fixes
 */
export class LinkFixUtils {
  static findFix(pattern: string, fixes: LinkFix[] = COMMON_FIXES): LinkFix | undefined {
    return fixes.find(fix => fix.pattern === pattern);
  }

  static applyFix(content: string, fix: LinkFix): string {
    return content.replace(new RegExp(fix.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replacement);
  }

  static validateFixes(fixes: LinkFix[]): { valid: LinkFix[]; invalid: LinkFix[] } {
    const valid: LinkFix[] = [];
    const invalid: LinkFix[] = [];

    fixes.forEach(fix => {
      if (fix.pattern && fix.replacement && fix.description) {
        valid.push(fix);
      } else {
        invalid.push(fix);
      }
    });

    return { valid, invalid };
  }

  static deduplicateFixes(fixes: LinkFix[]): LinkFix[] {
    const seen = new Set<string>();
    return fixes.filter(fix => {
      const key = `${fix.pattern}|${fix.replacement}`;
      if (seen.has(key)) {
        LoggingUtils.warn(`Duplicate link fix found: ${fix.pattern} -> ${fix.replacement}`);
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

/**
 * Configuration loader for external link fix files
 */
export class LinkFixConfigLoader {
  static async loadFromFile(configPath: string): Promise<LinkFix[]> {
    try {
      const config = FileSystemUtils.readJsonFile(configPath) as LinkFixCategory[] | null;
      if (!config) {
        LoggingUtils.error(`Failed to load link fix config from ${configPath}`);
        return [];
      }

      return config.flatMap((category: LinkFixCategory) =>
        category.fixes.map((fix: LinkFix) => ({
          ...fix,
          category: category.name
        }))
      );
    } catch (error) {
      LoggingUtils.error(`Error loading link fix config: ${error}`);
      return [];
    }
  }

  static async saveToFile(configPath: string, categories: LinkFixCategory[]): Promise<void> {
    try {
      FileSystemUtils.writeJsonFile(configPath, categories);
      LoggingUtils.success(`Saved ${categories.length} link fix categories to ${configPath}`);
    } catch (error) {
      LoggingUtils.error(`Error saving link fix config: ${error}`);
    }
  }
}

// Export the generated fixes for immediate use
export { LINK_FIX_CATEGORIES };


