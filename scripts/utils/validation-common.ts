#!/usr/bin/env tsx
/**
 * Common validation utilities shared across setup and test scripts
 * Reduces duplication in validation logic and error handling
 */

import { logger } from './logger';

export interface ValidationResult {
  isValid: boolean;
  passedSteps: number;
  totalSteps: number;
  duration: number;
  warnings: string[];
}

export interface ValidationSummary {
  overall: ValidationResult;
  summary: {
    warnings: string[];
    recommendations: string[];
  };
}

export interface ConsolidatedValidationResult {
  overall: {
    isValid: boolean;
    passedSteps: number;
    totalSteps: number;
    duration: number;
    warnings: string[];
  };
  steps: Record<string, ValidationResult>;
  summary: {
    criticalErrors: number;
    warnings: string[];
    recommendations: string[];
  };
}

/**
 * Common validation result formatter
 */
export function formatValidationResult(result: ValidationSummary | ConsolidatedValidationResult, title: string): void {
  if (!result.overall.isValid) {
    logger.error(`❌ ${title} failed with critical errors`);
    process.exit(1);
  }

  logger.success(`🎉 ${title} completed successfully!`);
  logger.info('\n📋 Summary:');
  logger.info(`   - Passed: ${result.overall.passedSteps}/${result.overall.totalSteps} steps`);
  logger.info(`   - Duration: ${result.overall.duration}ms`);

  // Handle both ValidationSummary and ConsolidatedValidationResult
  const warnings = 'criticalErrors' in result.summary
    ? result.summary.warnings
    : result.summary.warnings;

  logger.info(`   - Warnings: ${warnings.length}`);

  if (warnings.length > 0) {
    logger.info('\n⚠️ Warnings:');
    warnings.forEach(warning => {
      logger.warn(`   - ${warning}`);
    });
  }
}

/**
 * Common error handler for validation scripts
 */
export function handleValidationError(error: unknown, context: string): never {
  logger.error(`❌ ${context} failed:`);
  logger.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

/**
 * Common main function wrapper for validation scripts
 */
export function runValidationScript(
  mainFn: () => Promise<void>,
  scriptName: string
): void {
  mainFn().catch((error) => {
    logger.error(`❌ Unexpected error during ${scriptName}:`);
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

