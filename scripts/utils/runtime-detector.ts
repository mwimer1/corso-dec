#!/usr/bin/env tsx

/**
 * Runtime boundary detection utility
 * Detects client/server/edge compatibility for TypeScript modules
 */

import type { SourceFile } from 'ts-morph';
import { Project } from 'ts-morph';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

export type RuntimeType = 'client' | 'server' | 'edge' | 'universal' | 'unknown';

export interface RuntimeInfo {
  type: RuntimeType;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
  reason?: string;
}

// Singleton project instance
let projectInstance: Project | null = null;

function getProject(tsConfigPath: string = 'tsconfig.json'): Project {
  if (!projectInstance) {
    projectInstance = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: false,
    });
  }
  return projectInstance;
}

/**
 * Detect runtime compatibility for a TypeScript file or directory
 */
export async function detectRuntime(
  filePath: string,
  tsConfigPath: string = 'tsconfig.json'
): Promise<RuntimeInfo> {
  // Check for frontmatter override first
  const readmePath = path.join(path.dirname(filePath), 'README.md');
  if (existsSync(readmePath)) {
    const readmeContent = readFileSync(readmePath, 'utf8');
    const runtimeMatch = readmeContent.match(/runtime:\s*["']?(client|server|edge|universal|unknown)["']?/);
    if (runtimeMatch && runtimeMatch[1]) {
      return {
        type: runtimeMatch[1] as RuntimeType,
        confidence: 'high',
        signals: [`Frontmatter override: ${runtimeMatch[1]}`],
        reason: `Explicitly set in README frontmatter`,
      };
    }
  }

  // Check if it's a directory - look for index.ts or check subdirectories
  let targetFile = filePath;
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    const indexPath = path.join(filePath, 'index.ts');
    if (existsSync(indexPath)) {
      targetFile = indexPath;
    } else {
      // For directories without index.ts, check subdirectories for server-only signals
      // This is a heuristic - if any subdirectory has server-only, mark as server
      try {
        const entries = readdirSync(filePath, { withFileTypes: true });
        
        // Check subdirectories for server.ts or server-only imports
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const subServer = path.join(filePath, entry.name, 'server.ts');
            const subIndex = path.join(filePath, entry.name, 'index.ts');
            if (existsSync(subServer)) {
              return await detectRuntimeFromContent(subServer);
            }
            if (existsSync(subIndex)) {
              const result = await detectRuntimeFromContent(subIndex);
              if (result.type === 'server' && result.confidence === 'high') {
                return { ...result, signals: [...result.signals, `Detected in subdirectory: ${entry.name}`] };
              }
            }
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            // Check first .ts file found
            targetFile = path.join(filePath, entry.name);
            break;
          }
        }
        
        // If no suitable file found, return unknown
        if (targetFile === filePath) {
          return { type: 'unknown', confidence: 'low', signals: ['No index.ts or TypeScript files found for runtime detection'] };
        }
      } catch (error) {
        return { type: 'unknown', confidence: 'low', signals: [`Could not read directory: ${error instanceof Error ? error.message : String(error)}`] };
      }
    }
  }

  if (!existsSync(targetFile)) {
    return { type: 'unknown', confidence: 'low', signals: ['File not found'] };
  }

  try {
    const project = getProject(tsConfigPath);
    const sourceFile = project.getSourceFile(targetFile);
    
    if (!sourceFile) {
      // Try to add it
      project.addSourceFileAtPath(targetFile);
      const added = project.getSourceFile(targetFile);
      if (!added) {
        return detectRuntimeFromContent(targetFile);
      }
      return detectRuntimeFromSourceFile(added);
    }

    return detectRuntimeFromSourceFile(sourceFile);
  } catch (error) {
    // Fallback to content-based detection
    return await detectRuntimeFromContent(targetFile);
  }
}

function detectRuntimeFromSourceFile(sourceFile: SourceFile): RuntimeInfo {
  const signals: string[] = [];
  let serverScore = 0;
  let clientScore = 0;
  let edgeScore = 0;

  const content = sourceFile.getFullText();

  // Server-only signals (high confidence)
  if (content.includes("import 'server-only'")) {
    signals.push("import 'server-only'");
    serverScore += 10;
  }

  // Node.js-only modules
  const nodeModules = ['fs', 'net', 'tls', 'child_process', 'crypto', 'http', 'https', 'path', 'os', 'util'];
  for (const mod of nodeModules) {
    if (content.includes(`require('${mod}')`) || content.includes(`from '${mod}'`) || content.includes(`from "${mod}"`)) {
      signals.push(`Uses Node.js module: ${mod}`);
      serverScore += 5;
    }
  }

  // Next.js server APIs
  if (content.includes("from 'next/headers'") || content.includes('from "next/headers"')) {
    signals.push('Uses next/headers');
    serverScore += 8;
  }
  if (content.includes("from 'next/cookies'") || content.includes('from "next/cookies"')) {
    signals.push('Uses next/cookies');
    serverScore += 8;
  }

  // Client-only signals (high confidence)
  if (content.includes("'use client'") || content.includes('"use client"')) {
    signals.push("'use client' directive");
    clientScore += 10;
  }

  // Browser globals (medium confidence - could be in tests)
  const browserGlobals = ['window', 'document', 'localStorage', 'sessionStorage', 'navigator'];
  for (const global of browserGlobals) {
    if (new RegExp(`\\b${global}\\b`).test(content) && !content.includes('test') && !content.includes('spec')) {
      signals.push(`Uses browser global: ${global}`);
      clientScore += 3;
    }
  }

  // Edge-compatible signals
  if (content.includes("export const runtime = 'edge'") || content.includes('export const runtime = "edge"')) {
    signals.push("runtime = 'edge'");
    edgeScore += 10;
  }

  // Check imports for runtime indicators
  for (const imp of sourceFile.getImportDeclarations()) {
    const spec = imp.getModuleSpecifierValue();
    
    if (spec?.includes('server-only')) {
      signals.push(`Imports from server-only module`);
      serverScore += 5;
    }
    
    if (spec?.includes('@/lib/server') || spec?.includes('@/lib/integrations')) {
      signals.push(`Imports from server domain: ${spec}`);
      serverScore += 3;
    }
    
    if (spec?.includes('@/lib/api') || spec?.includes('@/lib/middleware/edge')) {
      signals.push(`Imports from edge-safe module: ${spec}`);
      edgeScore += 2;
    }
  }

  // Determine runtime type
  let type: RuntimeType = 'unknown';
  let confidence: 'high' | 'medium' | 'low' = 'low';
  let reason: string | undefined;

  if (serverScore >= 10) {
    type = 'server';
    confidence = 'high';
    reason = 'Strong server-only signals detected';
  } else if (clientScore >= 10) {
    type = 'client';
    confidence = 'high';
    reason = 'Client directive or browser APIs detected';
  } else if (edgeScore >= 10) {
    type = 'edge';
    confidence = 'high';
    reason = 'Explicit edge runtime declaration';
  } else if (serverScore > 0 && clientScore === 0 && edgeScore === 0) {
    type = 'server';
    confidence = serverScore >= 5 ? 'medium' : 'low';
    reason = 'Some server-only signals detected';
  } else if (clientScore > 0 && serverScore === 0) {
    type = 'client';
    confidence = clientScore >= 5 ? 'medium' : 'low';
    reason = 'Some client-only signals detected';
  } else if (serverScore === 0 && clientScore === 0 && edgeScore === 0) {
    type = 'universal';
    confidence = 'medium';
    reason = 'No runtime-specific signals detected (likely universal/isomorphic)';
  } else {
    type = 'unknown';
    confidence = 'low';
    reason = 'Conflicting or unclear runtime signals';
  }

  return {
    type,
    confidence,
    signals: signals.length > 0 ? signals : ['No runtime signals detected'],
    reason,
  };
}

async function detectRuntimeFromContent(filePath: string): Promise<RuntimeInfo> {
  try {
    const content = readFileSync(filePath, 'utf8');
    const signals: string[] = [];

  // Server-only signals
  if (content.includes("import 'server-only'")) {
    signals.push("import 'server-only'");
    return { type: 'server', confidence: 'high', signals, reason: 'server-only import detected' };
  }

  // Client-only signals
  if (content.includes("'use client'") || content.includes('"use client"')) {
    signals.push("'use client' directive");
    return { type: 'client', confidence: 'high', signals, reason: 'use client directive detected' };
  }

  // Edge runtime
  if (content.includes("export const runtime = 'edge'") || content.includes('export const runtime = "edge"')) {
    signals.push("runtime = 'edge'");
    return { type: 'edge', confidence: 'high', signals, reason: 'edge runtime declared' };
  }

  // Node.js modules
  const nodeModules = ['fs', 'net', 'tls', 'child_process'];
  for (const mod of nodeModules) {
    if (content.includes(`require('${mod}')`) || content.includes(`from '${mod}'`)) {
      signals.push(`Uses Node.js module: ${mod}`);
      return { type: 'server', confidence: 'medium', signals, reason: `Node.js module ${mod} detected` };
    }
  }

  return { type: 'unknown', confidence: 'low', signals: ['No clear runtime signals'] };
  } catch {
    return { type: 'unknown', confidence: 'low', signals: ['Could not read file'] };
  }
}

/**
 * Reset project instance (useful for testing)
 */
export function resetProject(): void {
  projectInstance = null;
}
