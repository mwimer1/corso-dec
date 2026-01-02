/**
 * scripts/utils/script-common.ts
 * Shared utilities for maintenance scripts to reduce duplication
 */

import fs from 'fs';
import path from 'path';
import { globbySync } from 'globby';

/**
 * Common file system operations
 */
export class FileSystemUtils {
  static readJsonFile<T = any>(filePath: string): T | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  static writeJsonFile(filePath: string, data: any): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  static ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static readFileSafe(filePath: string): string | null {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  static findFiles(pattern: string | string[], cwd = process.cwd()): string[] {
    return globbySync(pattern, { cwd, absolute: true });
  }
}

/**
 * Common validation patterns
 */
export class ValidationUtils {
  static isValidPath(filePath: string): boolean {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  }

  static hasValidExtension(filePath: string, extensions: string[]): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return extensions.includes(ext);
  }

  static isTypeScriptFile(filePath: string): boolean {
    return this.hasValidExtension(filePath, ['.ts', '.tsx']);
  }

  static isJavaScriptFile(filePath: string): boolean {
    return this.hasValidExtension(filePath, ['.js', '.jsx', '.mjs', '.cjs']);
  }
}

/**
 * Common logging patterns
 */
export class LoggingUtils {
  private static formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  }

  static info(message: string): void {
    console.log(this.formatMessage('info', message));
  }

  static warn(message: string): void {
    console.warn(this.formatMessage('warn', message));
  }

  static error(message: string): void {
    console.error(this.formatMessage('error', message));
  }

  static success(message: string): void {
    console.log(this.formatMessage('success', message));
  }
}

/**
 * Common pattern matching utilities
 */
export class PatternUtils {
  static extractFromRegex(text: string, pattern: RegExp): string[] {
    const matches: string[] = [];
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1]) matches.push(match[1]);
    }
    return matches;
  }

  static replaceAll(text: string, searchValue: string | RegExp, replaceValue: string): string {
    if (typeof searchValue === 'string') {
      return text.split(searchValue).join(replaceValue);
    }
    return text.replace(searchValue, replaceValue);
  }

  static matchAll(text: string, pattern: RegExp): RegExpMatchArray[] {
    const matches: RegExpMatchArray[] = [];
    let match;
    while ((match = pattern.exec(text)) !== null) {
      matches.push(match);
    }
    return matches;
  }
}

/**
 * Common configuration patterns
 */
export class ConfigUtils {
  static loadConfig<T>(configPath: string, fallback: T): T {
    const config = FileSystemUtils.readJsonFile<T>(configPath);
    return config ?? fallback;
  }

  static mergeConfigs<T extends Record<string, any>>(base: T, override: Partial<T>): T {
    return { ...base, ...override };
  }

  static validateConfig<T>(config: any, requiredKeys: (keyof T)[]): { valid: boolean; missing: string[] } {
    const missing = requiredKeys.filter(key => !(key in config));
    return {
      valid: missing.length === 0,
      missing: missing as string[]
    };
  }
}

/**
 * Common array/object processing utilities
 */
export class DataUtils {
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  static groupBy<T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  }

  static sortBy<T>(array: T[], keyFn: (item: T) => string | number): T[] {
    return [...array].sort((a, b) => {
      const aVal = keyFn(a);
      const bVal = keyFn(b);
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
  }

  static flatten<T>(arrays: T[][]): T[] {
    return arrays.reduce((flat, array) => flat.concat(array), []);
  }
}

/**
 * Common error handling patterns
 */
export class ErrorUtils {
  static handleError(error: unknown, context: string): void {
    const message = error instanceof Error ? error.message : String(error);
    LoggingUtils.error(`${context}: ${message}`);
    process.exitCode = 1;
  }

  static tryOrDefault<T>(fn: () => T, defaultValue: T): T {
    try {
      return fn();
    } catch {
      return defaultValue;
    }
  }

  static withErrorLogging<T>(fn: () => T, context: string): T | null {
    try {
      return fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      LoggingUtils.error(`${context}: ${message}`);
      return null;
    }
  }
}

