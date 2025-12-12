#!/usr/bin/env tsx
/**
 * Core utilities for unused styles analyzers
 * Consolidates common scanning, usage detection, and reporting logic
 */

import { readFileSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';
import { logger } from '../../utils/logger';

export interface StyleUsageResult {
  file: string;
  line: number;
  pattern: string;
  matchType: 'import' | 'jsx' | 'usage' | 'string';
}

export interface StyleAnalysisConfig {
  projectRoot?: string;
  ignorePatterns?: string[];
  includePatterns?: string[];
  minUsageThreshold?: number;
  accurateMode?: boolean;
}

export interface StyleAnalysisResult {
  totalExports: number;
  usedExports: number;
  unusedExports: number;
  usageRate: number;
  files: {
    [filePath: string]: {
      exports: number;
      used: number;
      unused: number;
      usageDetails: StyleUsageResult[];
    };
  };
  recommendations: string[];
}

export class StyleAnalysisCore {
  private projectRoot: string;
  private config: Required<StyleAnalysisConfig>;

  constructor(config: StyleAnalysisConfig = {}) {
    this.projectRoot = config.projectRoot || process.cwd();
    this.config = {
      projectRoot: this.projectRoot,
      ignorePatterns: ['node_modules/**', 'build/**', 'dist/**'],
      includePatterns: ['**/*.{ts,tsx,js,jsx}'],
      minUsageThreshold: 1,
      accurateMode: false,
      ...config
    };
  }

  /**
   * Collect style tokens from files in the specified directory
   */
  async collectStyleTokens(globs: string[]): Promise<string[]> {
    const tokens = new Set<string>();

    for (const globPattern of globs) {
      const files = await glob(globPattern, {
        cwd: this.projectRoot,
        ignore: this.config.ignorePatterns
      });

      for (const file of files) {
        try {
          const content = readFileSync(join(this.projectRoot, file), 'utf-8');
          const fileTokens = this.extractTokensFromContent(content, file);
          fileTokens.forEach(token => tokens.add(token));
        } catch (error) {
          logger.warn(`Warning: Could not read ${file}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return Array.from(tokens).sort();
  }

  /**
   * Scan usage of style tokens across source files
   */
  async scanUsage(tokens: string[], roots: string[] = ['components', 'lib', 'hooks', 'actions']): Promise<Map<string, number>> {
    const usage = new Map<string, number>();
    const sourceFiles = await this.getSourceFiles(roots);

    logger.info(`Scanning usage in ${sourceFiles.length} source files...`);

    // Initialize all tokens with 0 usage
    for (const token of tokens) {
      usage.set(token, 0);
    }

    for (const sourceFile of sourceFiles) {
      try {
        const content = readFileSync(join(this.projectRoot, sourceFile), 'utf-8');
        const fileUsage = this.detectTokenUsage(content, tokens, sourceFile);
        fileUsage.forEach((count, token) => {
          usage.set(token, (usage.get(token) || 0) + count);
        });
      } catch (error) {
        logger.warn(`Warning: Could not read ${sourceFile}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return usage;
  }

  /**
   * Generate analysis report in specified format
   */
  async emitReport(usage: Map<string, number>, format: 'json' | 'table' | 'pie' = 'table'): Promise<string | object> {
    const result = this.generateAnalysisResult(usage);

    switch (format) {
      case 'json':
        return result;
      case 'pie':
        return this.generateUsageReport(result);
      default:
        return this.generateTableReport(result);
    }
  }

  /**
   * Load configuration from file or use defaults
   */
  loadConfig(): Required<StyleAnalysisConfig> {
    return { ...this.config };
  }

  private async getSourceFiles(roots: string[]): Promise<string[]> {
    const patterns = roots.map(root => join(root, '**/*.{ts,tsx,js,jsx}'));
    return await glob(patterns, {
      cwd: this.projectRoot,
      ignore: this.config.ignorePatterns
    });
  }

  private extractTokensFromContent(content: string, file: string): string[] {
    const tokens: string[] = [];

    // Extract export patterns using a simpler approach
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;

      // Simple pattern matching for export statements
      if (line.startsWith('export ')) {
        // Match simple exports like "export const foo = ..."
        const simpleMatch = line.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/);
        if (simpleMatch) {
          // @ts-ignore - TypeScript strict mode issue with regex match array access
          tokens.push(simpleMatch[1]);
        }

        // Match named exports like "export { foo, bar }"
        const namedMatch = line.match(/export\s*\{\s*([^}]+)\s*\}/);
        if (namedMatch && namedMatch[1]) {
          const exportNames = namedMatch[1];
          if (exportNames) {
            const names = exportNames.split(',').map(name => name.trim().split(' as ')[0]?.trim()).filter((name): name is string => Boolean(name));
            tokens.push(...names);
          }
        }

        // Match wildcard exports like "export * from './foo'"
        const wildcardMatch = line.match(/export\s+\*\s+from\s+['"]([^'"]+)['"]/);
        if (wildcardMatch) {
          // @ts-ignore - TypeScript strict mode issue with regex match array access
          tokens.push(wildcardMatch[1]);
        }
      }
    }

    return tokens;
  }

  private detectTokenUsage(content: string, tokens: string[], file: string): Map<string, number> {
    const usage = new Map<string, number>();

    for (const token of tokens) {
      let count = 0;

      // Check for imports
      if (this.config.accurateMode) {
        const importPatterns = [
          new RegExp(`import.*\\b${token}\\b.*from`, 'g'),
          new RegExp(`from\\s+['"][^'"]*['"].*\\b${token}\\b`, 'g')
        ];

        for (const pattern of importPatterns) {
          if (pattern.test(content)) {
            count++;
            break;
          }
        }
      } else {
        // Simple string matching for performance
        if (content.includes(token)) {
          count++;
        }
      }

      // Always set the count, even if 0
      usage.set(token, count);
    }

    return usage;
  }

  private generateAnalysisResult(usage: Map<string, number>): StyleAnalysisResult {
    let totalExports = 0;
    let usedExports = 0;
    const files: StyleAnalysisResult['files'] = {};

    for (const [token, count] of usage) {
      totalExports++;
      if (count >= this.config.minUsageThreshold) {
        usedExports++;
      }

      // Group by file (simplified - in real implementation would track per file)
      const fileKey = 'aggregated'; // Would be actual file in real implementation
      if (!files[fileKey]) {
        files[fileKey] = {
          exports: 0,
          used: 0,
          unused: 0,
          usageDetails: []
        };
      }

      files[fileKey].exports++;
      if (count >= this.config.minUsageThreshold) {
        files[fileKey].used++;
      } else {
        files[fileKey].unused++;
      }
    }

    const usageRate = totalExports > 0 ? (usedExports / totalExports) * 100 : 0;

    const recommendations = this.generateRecommendations(usedExports, totalExports, usageRate);

    return {
      totalExports,
      usedExports,
      unusedExports: totalExports - usedExports,
      usageRate,
      files,
      recommendations
    };
  }

  private generateTableReport(result: StyleAnalysisResult): string {
    let report = '\n📊 STYLE USAGE ANALYSIS REPORT\n';
    report += '==============================\n\n';

    report += `📈 Summary:\n`;
    report += `   Total exports: ${result.totalExports}\n`;
    report += `   Used exports: ${result.usedExports}\n`;
    report += `   Unused exports: ${result.unusedExports}\n`;
    report += `   Usage rate: ${result.usageRate.toFixed(1)}%\n\n`;

    if (result.recommendations.length > 0) {
      report += '💡 Recommendations:\n';
      result.recommendations.forEach(rec => {
        report += `   ${rec}\n`;
      });
      report += '\n';
    }

    return report;
  }

  private generateUsageReport(result: StyleAnalysisResult): string {
    let report = '\n📊 STYLE USAGE DISTRIBUTION\n';
    report += '==========================\n\n';

    const usedPercent = (result.usedExports / result.totalExports) * 100;
    const unusedPercent = 100 - usedPercent;

    report += `📊 Usage Breakdown:\n`;
    report += `   ✅ Used: ${result.usedExports} (${usedPercent.toFixed(1)}%)\n`;
    report += `   ❌ Unused: ${result.unusedExports} (${unusedPercent.toFixed(1)}%)\n\n`;

    // Simple text representation
    const total = 20;
    const usedBars = Math.round((usedPercent / 100) * total);
    const unusedBars = total - usedBars;

    report += `   Visualization:\n`;
    report += `   [${'█'.repeat(usedBars)}${'░'.repeat(unusedBars)}]\n`;
    report += `    ${usedPercent.toFixed(1)}% Used        ${unusedPercent.toFixed(1)}% Unused\n\n`;

    return report;
  }

  private generateRecommendations(used: number, total: number, usageRate: number): string[] {
    const recommendations: string[] = [];

    if (usageRate < 50) {
      recommendations.push('⚠️  Low usage rate detected - consider removing unused styles');
    }

    if (total - used > 10) {
      recommendations.push('🔍 Review unused exports for potential cleanup');
    }

    if (usageRate >= 90) {
      recommendations.push('✅ High usage rate - styles are well utilized');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ No specific recommendations - usage looks good');
    }

    return recommendations;
  }
}

// Export factory function for easy usage
export function createStyleAnalyzer(config?: StyleAnalysisConfig): StyleAnalysisCore {
  return new StyleAnalysisCore(config);
}

