import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const IGNORE = new Set(['node_modules', '.next', 'dist', 'coverage', 'public']);
const isCode = (p: string) => /\.(ts|tsx|js|jsx)$/.test(p);
const EDGE_SERVER_IMPORT = /@\/lib\/server\//;
const EDGE_RL_SERVER = /@\/lib\/ratelimiting\/server/;

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir)) {
    if (IGNORE.has(e)) continue;
    const full = join(dir, e);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (isCode(full)) yield full;
  }
}

const read = (f: string) => readFileSync(f, 'utf8');
const hasEdgeRuntime = (s: string) => /export\s+const\s+runtime\s*=\s*['"]edge['"]/.test(s);
const isEdgeLibPath = (f: string) =>
  f.includes('lib/middleware/edge/') ||
  (f.includes('lib/api/') && !f.includes('lib/api/server/'));

describe('Edge runtime boundary', () => {
  it('Edge contexts must not import server-only modules', () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      if (!file.includes('/app/') && !file.includes('lib/middleware/edge/') && !file.includes('lib/api/')) continue;
      const src = read(file);
      const enforce = isEdgeLibPath(file) || (file.includes('/app/') && hasEdgeRuntime(src));
      if (!enforce) continue;
      if (EDGE_SERVER_IMPORT.test(src) || EDGE_RL_SERVER.test(src)) offenders.push(file);
    }
    expect(offenders, `Edge boundary violations:\n${offenders.join('\n')}`).toHaveLength(0);
  }, 30000); // give the walker time in CI
});

import * as fs from 'fs';
import * as path from 'path';

describe('Edge runtime boundary safety', () => {
  it('Edge routes do not import server-only modules', () => {
    // Define patterns for Edge runtime routes
    const edgeRoutes = [
      'app/api/public/health/route.ts',
      'app/api/v1/csp-report/route.ts',
    ];

    // Define server-only modules that should not be imported in Edge routes
    const serverOnlyModules = [
      '@/lib/server/',
      '@/lib/integrations/clickhouse/',
      '@/lib/core/server',
      '@/lib/services/entity/server',
      '@/lib/security',
      '@/lib/auth/authorization/',
      'next/server',
    ];

    for (const route of edgeRoutes) {
      const routePath = path.resolve(route);
      if (fs.existsSync(routePath)) {
        const content = fs.readFileSync(routePath, 'utf-8');

        for (const serverModule of serverOnlyModules) {
          // Check for direct imports of server-only modules
          if (content.includes(`from '${serverModule}'`) ||
              content.includes(`import('${serverModule}'`)) {
            throw new Error(`Edge route ${route} imports server-only module: ${serverModule}`);
          }

          // Check for import statements that could lead to server modules
          const importRegex = new RegExp(`import.*from ['"]@${serverModule}`, 'g');
          if (importRegex.test(content)) {
            throw new Error(`Edge route ${route} imports server-only module: ${serverModule}`);
          }
        }

        // Ensure Edge runtime is properly declared
        if (!content.includes("export const runtime = 'edge'") && !content.includes('export const runtime = "edge"')) {
          throw new Error(`Edge route ${route} does not declare Edge runtime`);
        }
      }
    }
  });

  it('Edge routes only use Edge-compatible environment access', () => {
    const edgeRoutes = [
      'app/api/public/health/route.ts',
      'app/api/v1/csp-report/route.ts',
    ];

    for (const route of edgeRoutes) {
      const routePath = path.resolve(route);
      if (fs.existsSync(routePath)) {
        const content = fs.readFileSync(routePath, 'utf-8');

        // Edge routes should use getEnvEdge(), not getEnv() or process.env
        if (content.includes('getEnv()') && !content.includes('getEnvEdge()')) {
          throw new Error(`Edge route ${route} uses getEnv() instead of getEnvEdge()`);
        }

        // Should not use process.env directly in Edge routes
        if (content.includes('process.env.') && !content.includes('getEnvEdge()')) {
          throw new Error(`Edge route ${route} uses process.env directly`);
        }
      }
    }
  });
});

