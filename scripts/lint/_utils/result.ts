/**
 * Standardized error collection and exit code handling for lint scripts
 * Ensures consistent behavior: collect errors, then set process.exitCode = 1
 */

/**
 * Result collector for lint scripts
 * Collects errors and warnings, then handles exit code consistently
 */
export class LintResult {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Add an error message
   */
  addError(message: string): void {
    this.errors.push(message);
  }

  /**
   * Add multiple error messages
   */
  addErrors(messages: string[]): void {
    this.errors.push(...messages);
  }

  /**
   * Add a warning message
   */
  addWarning(message: string): void {
    this.warnings.push(message);
  }

  /**
   * Add multiple warning messages
   */
  addWarnings(messages: string[]): void {
    this.warnings.push(...messages);
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Check if there are any warnings
   */
  hasWarnings(): boolean {
    return this.warnings.length > 0;
  }

  /**
   * Get all errors
   */
  getErrors(): readonly string[] {
    return [...this.errors];
  }

  /**
   * Get all warnings
   */
  getWarnings(): readonly string[] {
    return [...this.warnings];
  }

  /**
   * Report results and set exit code
   * Preserves existing output format by default
   */
  report(options: {
    successMessage?: string;
    errorPrefix?: string;
    warningPrefix?: string;
    jsonOutput?: boolean;
  } = {}): void {
    const {
      successMessage,
      errorPrefix = '❌',
      warningPrefix = '⚠️',
      jsonOutput = process.argv.includes('--json'),
    } = options;

    if (jsonOutput) {
      // JSON output mode (for future CI integration)
      console.log(JSON.stringify({
        success: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings,
        errorCount: this.errors.length,
        warningCount: this.warnings.length,
      }, null, 2));
    } else {
      // Default text output (preserves existing behavior)
      if (this.errors.length > 0) {
        if (errorPrefix) {
          console.error(`${errorPrefix} Found ${this.errors.length} error(s):`);
        }
        for (const error of this.errors) {
          console.error(`  ${error}`);
        }
        
        if (this.warnings.length > 0) {
          console.error('\nWarnings:');
          for (const warning of this.warnings) {
            console.error(`  ${warning}`);
          }
        }
      } else if (this.warnings.length > 0) {
        // Only warnings, no errors
        if (successMessage) {
          console.log(successMessage);
        }
        console.log('Warnings:');
        for (const warning of this.warnings) {
          console.log(`  ${warning}`);
        }
      } else if (successMessage) {
        // Success case
        console.log(successMessage);
      }
    }

    // Set exit code (never use process.exit)
    if (this.errors.length > 0) {
      process.exitCode = 1;
    }
  }
}

/**
 * Create a new LintResult instance
 */
export function createLintResult(): LintResult {
  return new LintResult();
}
