#!/usr/bin/env tsx

import fs from 'fs/promises';
import { glob } from 'glob';
import { generateLinkFixes, type LinkFix } from './link-fixes.config';

function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function toTitleCaseSet(s: 'common'|'remaining'|'final'): 'Common'|'Remaining'|'Final' {
  switch (s) {
    case 'common': return 'Common';
    case 'remaining': return 'Remaining';
    case 'final':
    default: return 'Final';
  }
}

function* iterFixes(set: 'common'|'remaining'|'final'): Generator<LinkFix> {
  // Use the refactored link fixes for all sets
  const allFixes = generateLinkFixes();
  yield* allFixes;
}

export async function runFixes(set: 'common'|'remaining'|'final' = 'remaining') {
  console.log(`🔧 Fixing ${set} broken link patterns...`);
  const markdownFiles = await glob('**/*.md', { ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'] });
  let totalFixes = 0, filesModified = 0;

  for (const file of markdownFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      let modified = false, fileFixes = 0, current = content;

      for (const fix of iterFixes(set)) {
        if (!current.includes(fix.pattern)) continue;
        const next = current.replace(new RegExp(escapeRe(fix.pattern), 'g'), fix.replacement);
        if (next !== current) {
          current = next; modified = true; fileFixes++; totalFixes++;
          console.log(`✅ Fixed: ${file} - ${fix.description}`);
        }
      }

      if (modified) {
        await fs.writeFile(file, current);
        filesModified++;
        console.log(`📝 Modified ${file} (${fileFixes} fixes)`);
      }

    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  console.log(`\n🎉 ${toTitleCaseSet(set)} link fixing complete!`);
  console.log(`📁 Files modified: ${filesModified}`);
  console.log(`🔗 Total fixes applied: ${totalFixes}`);

  return { filesModified, totalFixes };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv.find(a => a.startsWith('--set=')) ?? '--set=remaining';
  const set = arg.split('=')[1] as 'common'|'remaining'|'final';
  runFixes(set).catch(console.error);
}

