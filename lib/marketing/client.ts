/**
 * Client-safe marketing barrel.
 * Keep small; do NOT re-export server-only utilities or anything that pulls env/fs.
 */

// ROI Calculator
export { calcRoi, clamp } from './roi';

// Use Cases
export { zUseCaseMap } from './use-cases';
export type { UseCase, UseCaseKey } from './use-cases';



