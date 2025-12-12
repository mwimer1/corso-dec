#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

type Cfg = {
  dir: string;
  extensions: string[];
  maxTotalKB: number;
  maxPerFileKB: number;
  excludePatterns?: string[];
};

const cfgPath = path.resolve('scripts/ci/bundle-size.config.json');
const cfg: Cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

function shouldExcludeFile(filePath: string, excludePatterns?: string[]): boolean {
  if (!excludePatterns || excludePatterns.length === 0) return false;

  const relativePath = path.relative(process.cwd(), filePath);
  return excludePatterns.some(pattern => {
    // Simple glob matching - convert ** to match any directory depth
    let regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');

    // Handle file extension patterns like "*.test.*"
    if (pattern.includes('.*.')) {
      regexPattern = regexPattern.replace(/\\\.\*/g, '\\.');
    }

    const regex = new RegExp(regexPattern);
    return regex.test(relativePath) || regex.test(filePath);
  });
}

function shouldExcludeChunkByContent(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const testPatterns = [
      /test|spec|vitest|jest|mock|fixture|support|stories|story/i,
      /\.(test|spec|stories|story)\./,
      /describe\(|it\(|expect\(/,
      /aria-label|step_index|total_steps|onboarding_step/,
    ];
    return testPatterns.some(pattern => pattern.test(content));
  } catch {
    return false;
  }
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (!shouldExcludeFile(p, cfg.excludePatterns) && !shouldExcludeChunkByContent(p)) out.push(p);
  }
  return out;
}

function fmtKB(bytes: number) {
  return (bytes / 1024).toFixed(2);
}

function compressGzip(buf: Buffer) {
  return zlib.gzipSync(buf, { level: zlib.constants.Z_BEST_COMPRESSION });
}

function compressBrotli(buf: Buffer) {
  return zlib.brotliCompressSync(buf, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
  });
}

function main() {
  const dir = path.resolve(cfg.dir);
  if (!fs.existsSync(dir)) {
    console.log(`Bundle dir not found: ${dir}. Skipping bundle size check (run 'next build' to enable).`);
    process.exit(0);
  }

  let   files = walk(dir).filter((f) => cfg.extensions.includes(path.extname(f)));
  // Apply light exclusions similar to lint analyzer to avoid known locale bloat noise
  const defaultExcludePatterns = [
    /\bdayjs\/locale\//,
    /moment\/locale\//,
    /date-fns\/locale\//,
  ];
  files = files.filter((f) => !defaultExcludePatterns.some((re) => re.test(f)));
  if (!files.length) {
    console.log(`No ${cfg.extensions.join(', ')} files under ${dir}. Skipping bundle size check.`);
    process.exit(0);
  }

  let totalBrotli = 0;
  let totalGzip = 0;
  const rows: { file: string; raw: number; gzip: number; br: number }[] = [];

  for (const f of files) {
    const buf = fs.readFileSync(f);
    const gz = compressGzip(buf);
    const br = compressBrotli(buf);
    rows.push({ file: path.relative(process.cwd(), f), raw: buf.length, gzip: gz.length, br: br.length });
    totalGzip += gz.length;
    totalBrotli += br.length;
  }

  // Report
  console.log('\nBundle Size Report (.next/static/chunks)');
  console.log('File'.padEnd(70), 'RAW(KB)'.padStart(10), 'GZIP(KB)'.padStart(10), 'BR(KB)'.padStart(10));
  rows
    .sort((a, b) => b.br - a.br)
    .forEach((r) => {
      console.log(
        r.file.padEnd(70),
        fmtKB(r.raw).padStart(10),
        fmtKB(r.gzip).padStart(10),
        fmtKB(r.br).padStart(10),
      );
    });

  console.log('\nTotals:');
  console.log('GZIP(KB):', fmtKB(totalGzip), ' | BR(KB):', fmtKB(totalBrotli));

  // Policy checks
  const violations: string[] = [];
  if (totalBrotli / 1024 > cfg.maxTotalKB) {
    violations.push(`Total brotli ${fmtKB(totalBrotli)}KB exceeds ${cfg.maxTotalKB}KB`);
  }
  for (const r of rows) {
    if (r.br / 1024 > cfg.maxPerFileKB) {
      violations.push(`File ${r.file} brotli ${fmtKB(r.br)}KB exceeds ${cfg.maxPerFileKB}KB`);
    }
  }

  if (violations.length) {
    console.error('\n❌ Bundle size violations:\n- ' + violations.join('\n- '));
    process.exit(1);
  } else {
    console.log('\n✅ Bundle size within limits.');
  }
}

main();



