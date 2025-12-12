// scripts/utils/fs/operations.ts
import { cp, mkdir, rm } from 'node:fs/promises';
export const ensureDir = (p: string) => mkdir(p, { recursive: true });
export const remove = (p: string, opts: { recursive?: boolean; force?: boolean } = {}) => rm(p, { recursive: true, force: true, ...opts });
export const copy = (src: string, dest: string, opts: { recursive?: boolean } = { recursive: true }) => cp(src, dest, opts);

