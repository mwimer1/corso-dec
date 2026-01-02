/**
 * Client-safe marketing barrel.
 * Keep small; do NOT re-export server-only utilities or anything that pulls env/fs.
 */

// ROI Calculator
export { calcRoi, clamp } from './roi';

// Use Cases (re-exported from types barrel for convenience)
export { zUseCaseMap } from '@/types/marketing';
export type { UseCase, UseCaseKey } from '@/types/marketing';



