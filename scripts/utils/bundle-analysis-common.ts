#!/usr/bin/env tsx
/**
 * Common utilities for bundle analysis
 * Consolidates patterns used across check-bundle-size.ts and generate-bundle-report.ts
 * Note: generate-bundle-report.ts is located at scripts/ci/generate-bundle-report.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'zlib';

export interface BundleFileData {
  name?: string;
  path?: string;
  size?: number;
  rawSize?: number;
  gzippedSize?: number;
  gzipSize?: number;
}

export interface BundleAnalysisData {
  totalSize: number;
  totalGzippedSize: number;
  files: BundleFileData[];
}

export interface BundleComparisonResult {
  diff: number;
  diffPercent: number;
  diffFormatted: string;
  isIncrease: boolean;
  isDecrease: boolean;
  isSignificant: boolean;
}

/**
 * Common pattern for formatting bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Common pattern for calculating gzipped size
 */
export function calculateGzippedSize(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath);
    const gzipped = gzipSync(content);
    return gzipped.length;
  } catch (error) {
    console.warn(`Warning: Could not gzip ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
}

/**
 * Common pattern for comparing bundle sizes
 */
export function compareBundleSizes(
  previousSize: number,
  currentSize: number,
  significanceThreshold: number = 5
): BundleComparisonResult {
  const diff = currentSize - previousSize;
  const diffPercent = previousSize > 0 ? Math.round((diff / previousSize) * 100) : 0;

  return {
    diff,
    diffPercent,
    diffFormatted: formatBytes(Math.abs(diff)),
    isIncrease: diff > 0,
    isDecrease: diff < 0,
    isSignificant: Math.abs(diffPercent) >= significanceThreshold
  };
}

/**
 * Common pattern for validating bundle size
 */
export function validateBundleSize(
  bundleData: BundleAnalysisData,
  maxSizeBytes: number
): {
  isValid: boolean;
  utilizationPercent: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
} {
  const utilizationPercent = Math.round((bundleData.totalGzippedSize / maxSizeBytes) * 100);
  
  return {
    isValid: bundleData.totalGzippedSize <= maxSizeBytes,
    utilizationPercent,
    isNearLimit: utilizationPercent >= 90,
    isOverLimit: bundleData.totalGzippedSize > maxSizeBytes
  };
}

/**
 * Common pattern for analyzing bundle files
 */
export function analyzeBundleFiles(files: BundleFileData[]): {
  largestFiles: BundleFileData[];
  totalFiles: number;
  averageFileSize: number;
} {
  const sortedFiles = [...files].sort((a, b) => {
    const aSize = a.gzippedSize || a.gzipSize || 0;
    const bSize = b.gzippedSize || b.gzipSize || 0;
    return bSize - aSize;
  });
  
  const totalFiles = files.length;
  const totalSize = files.reduce((sum, file) => sum + (file.gzippedSize || file.gzipSize || 0), 0);
  const averageFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;
  
  return {
    largestFiles: sortedFiles.slice(0, 10), // Top 10 largest files
    totalFiles,
    averageFileSize
  };
}

/**
 * Common pattern for generating bundle performance metrics
 */
export function generateBundlePerformanceMetrics(
  bundleData: BundleAnalysisData,
  maxSizeBytes: number = 300 * 1024
): {
  utilizationPercent: number;
  estimatedLoadTime: number;
  performanceStatus: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
} {
  const validation = validateBundleSize(bundleData, maxSizeBytes);
  const estimatedLoadTime = Math.round((bundleData.totalGzippedSize / 1024) * 0.1);
  
  let performanceStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  const recommendations: string[] = [];
  
  if (validation.isOverLimit) {
    performanceStatus = 'critical';
    recommendations.push('Bundle size exceeds limit - immediate optimization required');
    recommendations.push('Consider code splitting and dynamic imports');
    recommendations.push('Audit large dependencies');
  } else if (validation.isNearLimit) {
    performanceStatus = 'warning';
    recommendations.push('Bundle size approaching limit - monitor closely');
    recommendations.push('Consider proactive optimization');
  } else if (validation.utilizationPercent >= 80) {
    performanceStatus = 'warning';
    recommendations.push('Bundle size growing - consider optimization');
  } else {
    recommendations.push('Bundle size healthy - continue monitoring');
  }
  
  return {
    utilizationPercent: validation.utilizationPercent,
    estimatedLoadTime,
    performanceStatus,
    recommendations
  };
}

/**
 * Common pattern for generating bundle summary table
 */
export function generateBundleSummaryTable(
  bundleData: BundleAnalysisData,
  maxSizeBytes: number = 300 * 1024
): string {
  const validation = validateBundleSize(bundleData, maxSizeBytes);
  
  let table = '| Metric | Value | Status |\n';
  table += '|--------|-------|--------|\n';
  table += `| **Current Size** | ${formatBytes(bundleData.totalGzippedSize)} | ${validation.isValid ? '✅' : '❌'} |\n`;
  table += `| **Size Limit** | ${formatBytes(maxSizeBytes)} | - |\n`;
  table += `| **Utilization** | ${validation.utilizationPercent}% | ${validation.utilizationPercent < 80 ? '🟢' : validation.utilizationPercent < 90 ? '🟡' : '🔴'} |\n`;
  
  return table;
}

/**
 * Collect bundle analysis by scanning a directory for asset files and computing raw/gzip sizes.
 * Defaults align with CI check script conventions.
 */
export async function collectBundleAnalysis(options?: {
  dir?: string;
  extensions?: string[];
}): Promise<BundleAnalysisData> {
  const dir = path.resolve(options?.dir ?? '.next/static/chunks');
  const extensions = options?.extensions ?? ['.js', '.css'];

  const walk = (d: string): string[] => {
    const out: string[] = [];
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) out.push(...walk(p));
      else out.push(p);
    }
    return out;
  };

  if (!fs.existsSync(dir)) {
    return { totalSize: 0, totalGzippedSize: 0, files: [] };
  }

  const files = walk(dir).filter((f) => extensions.includes(path.extname(f)));
  const fileData: BundleFileData[] = [];
  let totalRaw = 0;
  let totalGzip = 0;

  for (const f of files) {
    const buf = fs.readFileSync(f);
    const gz = gzipSync(buf);
    const item = {
      name: path.basename(f),
      path: path.relative(process.cwd(), f),
      size: buf.length,
      rawSize: buf.length,
      gzippedSize: gz.length,
      gzipSize: gz.length,
    } satisfies BundleFileData;
    fileData.push(item);
    totalRaw += buf.length;
    totalGzip += gz.length;
  }

  return {
    totalSize: totalRaw,
    totalGzippedSize: totalGzip,
    files: fileData,
  };
}

