import fs from "node:fs";
import path from "node:path";
import { ensureDir, readText, writeText } from "../utils/fs";

export async function writeIfChangedAtomic(targetPath: string, newContent: string) {
  const prev = fs.existsSync(targetPath) ? await readText(targetPath) : "";
  if (prev === newContent) return false;
  const tmp = targetPath + ".tmp";
  await ensureDir(path.dirname(targetPath));
  await writeText(tmp, newContent);
  await fs.promises.rename(tmp, targetPath);
  return true;
}

/**
 * Tolerant marker replacement. Accepts variants like:
 * <!--BEGIN:name-->, <!-- BEGIN:name -->, case-insensitive.
 * If markers missing, returns original content unchanged.
 * Always normalizes injected block to:
 * <!-- BEGIN:name -->\n...replacement...\n<!-- END:name -->
 */
export function replaceBetweenMarkers(content: string, markerName: string, replacementMarkdown: string) {
  const name = markerName.trim();
  const openRe = new RegExp(`<!--\\s*BEGIN(?:\\s*:\\s*|\\s+)${name}\\s*-->`, 'i');
  const closeRe = new RegExp(`<!--\\s*END(?:\\s*:\\s*|\\s+)${name}\\s*-->`, 'i');
  const openMatch = content.match(openRe);
  const closeMatch = content.match(closeRe);
  if (!openMatch || !closeMatch) {
    return content;
  }
  const openIndex = openMatch.index ?? -1;
  const closeIndex = closeMatch.index ?? -1;
  if (openIndex === -1 || closeIndex === -1 || closeIndex <= openIndex) {
    return content;
  }
  const before = content.slice(0, (openIndex + openMatch[0].length));
  const after = content.slice(closeIndex + closeMatch[0].length);
  const normalized = `<!-- BEGIN:${name} -->\n${replacementMarkdown.trim()}\n<!-- END:${name} -->`;
  const hasTrailingNewlineBefore = /\n$/.test(before);
  const hasLeadingNewlineAfter = /^\n/.test(after);
  const joinerBefore = hasTrailingNewlineBefore ? '' : '\n';
  const joinerAfter = hasLeadingNewlineAfter ? '' : '\n';
  return `${before}${joinerBefore}${normalized}${joinerAfter}${after}`;
}

export function replaceBetweenMarkersResult(content: string, markerName: string, replacementMarkdown: string): { content: string; changed: boolean } {
  const next = replaceBetweenMarkers(content, markerName, replacementMarkdown);
  return { content: next, changed: next !== content };
}

export function hasMarkers(content: string, markerName: string): boolean {
  const name = markerName.trim();
  const openRe = new RegExp(`<!--\\s*BEGIN(?:\\s*:\\s*|\\s+)${name}\\s*-->`, 'i');
  const closeRe = new RegExp(`<!--\\s*END(?:\\s*:\\s*|\\s+)${name}\\s*-->`, 'i');
  return openRe.test(content) && closeRe.test(content);
}

