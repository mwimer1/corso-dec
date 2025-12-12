// scripts/utils/fs/write.ts
import { writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
export const writeTextSync = (p: string, s: string) => writeFileSync(p, s, 'utf8');
export const writeJsonSync = (p: string, v: unknown, space = 2) => writeTextSync(p, JSON.stringify(v, null, space));
export const writeText = (p: string, s: string) => writeFile(p, s, 'utf8');
export const writeJson = (p: string, v: unknown, space = 2) => writeFile(p, JSON.stringify(v, null, space), 'utf8');

