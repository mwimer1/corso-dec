#!/usr/bin/env tsx
/**
 * Generates a Markdown route tree from /app for docs.
 * Usage: pnpm docs:routes
 */
import fs from 'node:fs';
import path from 'node:path';

type TreeNode = { name: string; children: TreeNode[]; isLeaf?: boolean };

const APP_DIR = path.join(process.cwd(), 'app');
const isRouteFile = (p: string): boolean => /(?:^|\\|\/)(page|route)\.(tsx?|mdx?)$/.test(p);

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (isRouteFile(full)) {
      out.push(path.relative(APP_DIR, full).replace(/\\/g, '/'));
    }
  }
  return out.sort();
}

function toRoutePath(rel: string): string {
  // e.g. "(protected)/dashboard/chat/page.tsx" -> "/dashboard/chat"
  const parts = rel
    .split('/')
    .slice(0, -1)
    .filter((seg) => !(seg.startsWith('(') && seg.endsWith(')')));
  return '/' + parts.join('/');
}

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: '/', children: [] };
  for (const rel of paths) {
    const route = toRoutePath(rel);
    const segs = route.split('/').filter(Boolean);
    let cur = root;
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      if (!seg) continue; // Skip undefined segments
      
      let child = cur.children.find((c) => c.name === seg);
      if (!child) {
        child = { name: seg, children: [] };
        cur.children.push(child);
      }
      cur = child;
      if (i === segs.length - 1) cur.isLeaf = true;
    }
  }
  return root;
}

function printTree(node: TreeNode, depth = 0): string[] {
  const lines: string[] = [];
  if (depth === 0) {
    lines.push('```txt');
    lines.push('/');
  } else {
    const indent = '  '.repeat(depth - 1);
    lines.push(`${indent}└─ ${node.name}${node.isLeaf ? '' : ''}`);
  }
  const children = node.children.sort((a, b) => a.name.localeCompare(b.name));
  for (const c of children) lines.push(...printTree(c, depth + 1));
  if (depth === 0) lines.push('```');
  return lines;
}

if (!fs.existsSync(APP_DIR)) {
  console.error('No app/ directory found. Skipping.');
  process.exit(0);
}

const files = walk(APP_DIR);
const tree = buildTree(files);
const md = [
  '<!-- AUTO-GENERATED: do not edit directly. Run `pnpm docs:routes`. -->',
  ...printTree(tree),
].join('\n') + '\n';

const OUT_DIR = path.join(process.cwd(), 'docs', 'codebase', '_generated');
fs.mkdirSync(OUT_DIR, { recursive: true });
const OUT_FILE = path.join(OUT_DIR, 'app-routes.md');
fs.writeFileSync(OUT_FILE, md, 'utf8');
console.log('Wrote', path.relative(process.cwd(), OUT_FILE));



