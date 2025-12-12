#!/usr/bin/env tsx
/**
 * Unused Styles Detector
 *
 * Analyzes the styles directory to identify potentially unused style variants
 * and exports. This helps maintain a clean styles codebase by detecting
 * orphaned styles that are no longer referenced.
 *
 * Usage:
 *   pnpm exec tsx scripts/maintenance/unused-styles/unused-styles-detector.ts
 */

import { createStyleAnalyzer } from './core';

interface StyleExport {
  name: string;
  file: string;
  line: number;
  isUsed: boolean;
  usageCount: number;
  usageFiles: string[];
}

interface AnalysisResult {
  totalExports: number;
  unusedExports: StyleExport[];
  usedExports: StyleExport[];
  files: {
    [filePath: string]: {
      exports: StyleExport[];
      unusedCount: number;
    };
  };
}

class UnusedStylesDetector {
  private analyzer = createStyleAnalyzer({
    accurateMode: false, // Use fast string matching for performance
    minUsageThreshold: 1
  });

  private exports: StyleExport[] = [];
  private analysisResult: AnalysisResult = {
    totalExports: 0,
    unusedExports: [],
    usedExports: [],
    files: {}
  };

  async analyze(): Promise<AnalysisResult> {
    console.log('🔍 Analyzing styles directory for unused exports...\n');

    // Step 1: Find all style files using core
    const styleFiles = await this.findStyleFiles();
    console.log(`📁 Found ${styleFiles.length} style files`);

    // Step 2: Extract exports from each file
    for (const file of styleFiles) {
      await this.extractExports(file);
    }

    console.log(`📤 Found ${this.exports.length} total exports`);

    // Step 3: Check usage of each export using core
    await this.checkUsage();

    // Step 4: Generate analysis
    this.generateAnalysis();

    return this.analysisResult;
  }

  private async findStyleFiles(): Promise<string[]> {
    const patterns = [
      'styles/**/*.ts',
      'styles/**/*.tsx',
      'styles/**/*.css'
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await this.analyzer.collectStyleTokens([pattern]);
      // For finding files, we'll use a simpler approach since collectStyleTokens returns tokens
      // In a real implementation, we'd need a separate file discovery method
      // For now, use the original glob approach
      const { glob } = await import('glob');
      const fileMatches = await glob(pattern, { cwd: this.analyzer['projectRoot'] });
      files.push(...fileMatches);
    }

    return files.filter(file => {
      // Skip build outputs and node_modules
      return !file.includes('node_modules') &&
             !file.includes('build') &&
             !file.includes('.d.ts');
    });
  }

  private async extractExports(filePath: string): Promise<void> {
    // Use core's token extraction logic
    const { readFileSync } = await import('fs');
    const { join } = await import('path');

    try {
      const content = readFileSync(join(this.analyzer['projectRoot'], filePath), 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Match export patterns (simplified version of core logic)
        const exportPatterns = [
          /export\s+(?:const|function|class|interface|type)\s+(\w+)/g,
          /export\s*\{\s*([^}]+)\s*\}/g,
          /export\s+\*\s+from\s+['"]([^'"]+)['"]/g
        ];

        for (const pattern of exportPatterns) {
          if (!line) break;

          let match;
          while ((match = pattern.exec(line)) !== null) {
            if (pattern === exportPatterns[1] && match[1]) {
              // Handle named exports like export { foo, bar }
              const names = match[1].split(',').map(name => name.trim().split(' as ')[0]);
              for (const name of names) {
                if (name && name.trim()) {
                  this.exports.push({
                    name: name.trim(),
                    file: filePath,
                    line: i + 1,
                    isUsed: false,
                    usageCount: 0,
                    usageFiles: []
                  });
                }
              }
            } else if (match[1]) {
              // Handle other export types
              const name = match[1];
              this.exports.push({
                name,
                file: filePath,
                line: i + 1,
                isUsed: false,
                usageCount: 0,
                usageFiles: []
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not read file ${filePath}:`, error);
    }
  }

  private async checkUsage(): Promise<void> {
    console.log('🔎 Checking usage of exports...');

    // Find all source files that might import styles using core logic
    const { glob } = await import('glob');
    const sourceFiles = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: this.analyzer['projectRoot'],
      ignore: ['node_modules/**', 'build/**', 'dist/**', 'styles/**']
    });

    console.log(`📄 Checking ${sourceFiles.length} source files`);

    for (const exportItem of this.exports) {
      for (const sourceFile of sourceFiles) {
        try {
          const { readFileSync } = await import('fs');
          const { join } = await import('path');
          const content = readFileSync(join(this.analyzer['projectRoot'], sourceFile), 'utf-8');

          // Check for various import patterns
          const importPatterns = [
            new RegExp(`import.*\\b${exportItem.name}\\b.*from`, 'g'),
            new RegExp(`\\b${exportItem.name}\\b`, 'g'),
            new RegExp(`from\\s+['"]@/styles[^'"]*['"]`, 'g')
          ];

          for (const pattern of importPatterns) {
            if (pattern.test(content)) {
              exportItem.isUsed = true;
              exportItem.usageCount++;
              if (!exportItem.usageFiles.includes(sourceFile)) {
                exportItem.usageFiles.push(sourceFile);
              }
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }

  private generateAnalysis(): void {
    this.analysisResult.totalExports = this.exports.length;
    this.analysisResult.unusedExports = this.exports.filter(exp => !exp.isUsed);
    this.analysisResult.usedExports = this.exports.filter(exp => exp.isUsed);

    // Group by file
    for (const exportItem of this.exports) {
      if (!this.analysisResult.files[exportItem.file]) {
        this.analysisResult.files[exportItem.file] = {
          exports: [],
          unusedCount: 0
        };
      }

      const fileData = this.analysisResult.files[exportItem.file];
      if (fileData) {
        fileData.exports.push(exportItem);
        if (!exportItem.isUsed) {
          fileData.unusedCount++;
        }
      }
    }
  }

  printReport(): void {
    const { totalExports, unusedExports, usedExports } = this.analysisResult;

    console.log('\n📊 UNUSED STYLES ANALYSIS REPORT');
    console.log('=====================================\n');

    console.log(`📈 Summary:`);
    console.log(`   Total exports: ${totalExports}`);
    console.log(`   Used exports: ${usedExports.length}`);
    console.log(`   Unused exports: ${unusedExports.length}`);
    console.log(`   Usage rate: ${((usedExports.length / totalExports) * 100).toFixed(1)}%\n`);

    if (unusedExports.length > 0) {
      console.log('🚨 UNUSED EXPORTS:');
      console.log('==================\n');

      // Group unused exports by file
      const unusedByFile: { [file: string]: StyleExport[] } = {};
      for (const exportItem of unusedExports) {
        if (exportItem.file) {
          if (!unusedByFile[exportItem.file]) {
            unusedByFile[exportItem.file] = [];
          }
          unusedByFile[exportItem.file]!.push(exportItem);
        }
      }

      for (const [file, exports] of Object.entries(unusedByFile)) {
        console.log(`📁 ${file} (${exports.length} unused):`);
        for (const exportItem of exports) {
          console.log(`   ❌ ${exportItem.name} (line ${exportItem.line})`);
        }
        console.log('');
      }

      console.log('💡 RECOMMENDATIONS:');
      console.log('===================');
      console.log('1. Review unused exports to confirm they are truly unused');
      console.log('2. Consider removing unused exports to reduce bundle size');
      console.log('3. Check if exports are used in dynamic imports or string-based references');
      console.log('4. Verify exports are not used in external packages or documentation\n');
    } else {
      console.log('✅ No unused exports found! Great job maintaining clean styles.\n');
    }

    // Show files with most unused exports
    const filesWithUnused = Object.entries(this.analysisResult.files)
      .filter(([_, data]) => data.unusedCount > 0)
      .sort(([_, a], [__, b]) => b.unusedCount - a.unusedCount);

    if (filesWithUnused.length > 0) {
      console.log('📋 FILES WITH UNUSED EXPORTS:');
      console.log('==============================');
      for (const [file, data] of filesWithUnused.slice(0, 10)) {
        console.log(`   ${file}: ${data.unusedCount} unused exports`);
      }
      console.log('');
    }
  }
}

// Main execution
async function main() {
  try {
    const detector = new UnusedStylesDetector();
    const result = await detector.analyze();
    detector.printReport();
    
    // Exit with error code if unused exports found
    if (result.unusedExports.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error analyzing styles:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { UnusedStylesDetector };

