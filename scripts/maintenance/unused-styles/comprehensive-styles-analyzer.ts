#!/usr/bin/env tsx
/**
 * Comprehensive Styles Directory Analysis
 *
 * Provides a complete analysis of the styles directory, including:
 * - Unused style variants and exports
 * - Recommendations for cleanup
 * - Tools for ongoing maintenance
 */

import { createStyleAnalyzer } from './core';

interface StylesAnalysis {
  totalFiles: number;
  totalExports: number;
  unusedExports: number;
  recommendations: string[];
  tools: string[];
}

class ComprehensiveStylesAnalyzer {
  private analyzer = createStyleAnalyzer({
    accurateMode: false, // Use fast analysis for comprehensive overview
    minUsageThreshold: 1
  });

  async analyze(): Promise<StylesAnalysis> {
    const analysis: StylesAnalysis = {
      totalFiles: 0,
      totalExports: 0,
      unusedExports: 0,
      recommendations: [],
      tools: [],
    };

    // Analyze styles directory structure using core
    await this.analyzeStylesDirectory(analysis);


    // Generate recommendations
    this.generateRecommendations(analysis);

    return analysis;
  }

  private async analyzeStylesDirectory(analysis: StylesAnalysis): Promise<void> {
    // Use core to collect style tokens from all style files
    const styleTokens = await this.analyzer.collectStyleTokens([
      'styles/**/*.ts',
      'styles/**/*.tsx',
      'styles/**/*.css'
    ]);

    analysis.totalFiles = styleTokens.length; // Approximate file count from token extraction
    analysis.totalExports = styleTokens.length;

    // Scan usage using core
    const usage = await this.analyzer.scanUsage(styleTokens);

    // Calculate unused exports
    let usedExports = 0;
    for (const count of usage.values()) {
      if (count >= this.analyzer.loadConfig().minUsageThreshold) {
        usedExports++;
      }
    }

    analysis.unusedExports = analysis.totalExports - usedExports;
  }


  private generateRecommendations(analysis: StylesAnalysis): void {
    // General recommendations
    analysis.recommendations.push('🔍 Regular audits: Run unused styles detection monthly');
    analysis.recommendations.push('📦 Bundle analysis: Use tools like webpack-bundle-analyzer to identify unused CSS');
    analysis.recommendations.push('🧹 Clean exports: Remove unused exports from index.ts files');
    analysis.recommendations.push('📚 Documentation: Keep README files updated when removing components');


    // Tools recommendations
    analysis.tools.push('knip: Detect unused exports and dependencies');
    analysis.tools.push('ast-grep: Find code patterns and unused imports');
    analysis.tools.push('ripgrep: Fast text search for usage analysis');
    analysis.tools.push('Custom scripts: Automated unused styles detection');
  }

  printReport(analysis: StylesAnalysis): void {
    console.log('\n📊 COMPREHENSIVE STYLES DIRECTORY ANALYSIS');
    console.log('==========================================\n');

    console.log('📈 Overview:');
    console.log(`   Total style files: ${analysis.totalFiles}`);
    console.log(`   Total exports: ${analysis.totalExports}`);
    console.log(`   Estimated unused: ${analysis.unusedExports}`);
    console.log(`   Usage rate: ${(((analysis.totalExports - analysis.unusedExports) / analysis.totalExports) * 100).toFixed(1)}%\n`);


    console.log('💡 Recommendations:');
    for (const rec of analysis.recommendations) {
      console.log(`   ${rec}`);
    }

    console.log('\n🛠️  Recommended Tools:');
    for (const tool of analysis.tools) {
      console.log(`   • ${tool}`);
    }

    console.log('\n🔧 Available Scripts:');
    console.log('   • pnpm exec tsx scripts/maintenance/unused-styles/unused-styles-detector.ts');

    console.log('\n📋 Next Steps:');
    console.log('   1. Review the analysis results above');
    console.log('   2. Run the specific analyzers for detailed findings');
    console.log('   3. Remove unused styles and components');
    console.log('   4. Update documentation and index files');
    console.log('   5. Set up automated checks in CI/CD\n');
  }
}

// Main execution
async function main() {
  try {
    const analyzer = new ComprehensiveStylesAnalyzer();
    const analysis = await analyzer.analyze();
    analyzer.printReport(analysis);
  } catch (error) {
    console.error('❌ Error analyzing styles directory:', error);
    process.exit(1);
  }
}

// Run the analysis
main().catch(console.error);

export { ComprehensiveStylesAnalyzer };

