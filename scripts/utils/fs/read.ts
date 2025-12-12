// scripts/utils/fs/read.ts
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
export const readTextSync = (p: string) => readFileSync(p, 'utf8');
export const readJsonSync = <T = unknown>(p: string) => JSON.parse(readTextSync(p)) as T;
export const readText = (p: string) => readFile(p, 'utf8');
export const readJson = async <T = unknown>(p: string) => JSON.parse(await readText(p)) as T;

