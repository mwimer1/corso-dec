#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');

function walk(dir) {
  const res = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (['node_modules', '.git', 'dist', '.next', 'build'].includes(name)) continue;
      res.push(...walk(full));
    } else if (stat.isFile() && full.endsWith('.md')) {
      res.push(full);
    }
  }
  return res;
}

function findFilesByBasename(basename) {
  const all = walk(repoRoot);
  return all.filter(f => path.basename(f) === basename);
}

function fileExistsRelative(fromDir, candidate) {
  try {
    return fs.existsSync(path.resolve(fromDir, candidate));
  } catch {
    return false;
  }
}

function computeRel(fromDir, targetAbs) {
  let rel = path.relative(fromDir, targetAbs).replace(/\\/g, '/');
  if (!rel) rel = './' + path.basename(targetAbs);
  return rel;
}

const mdFiles = walk(repoRoot);
let modifiedFiles = 0;

for (const md of mdFiles) {
  let content = fs.readFileSync(md, 'utf8');
  const dir = path.dirname(md);
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  let updated = content;
  while ((m = linkRegex.exec(content)) !== null) {
    const fullMatch = m[0];
    const text = m[1];
    const target = m[2].trim();

    if (/^https?:\/\//.test(target) || target.startsWith('#') || target === '') continue;
    // ignore anchor-only or mailto
    if (target.startsWith('mailto:')) continue;

    // If target exists relative to md, keep
    if (fileExistsRelative(dir, target)) continue;

    const base = path.basename(target);
    // Skip obvious placeholders
    if (base === 'path-to-doc.md' || base.startsWith('README-') && !base.endsWith('.md')) continue;

    const candidates = findFilesByBasename(base);
    if (candidates.length === 1) {
      const rel = computeRel(dir, candidates[0]);
      const replacement = `[${text}](${rel})`;
      updated = updated.split(fullMatch).join(replacement);
      console.log('Auto-fixed', md, '->', target, '=>', rel);
    }
    // if multiple candidates, skip (avoid wrong fixes)
  }

  if (updated !== content) {
    fs.writeFileSync(md, updated, 'utf8');
    modifiedFiles++;
  }
}

console.log(`Done. Modified files: ${modifiedFiles}`);



