/**
 * @fileoverview Marketing Domain Barrel Export
 * @description Public, client-safe surface only. Keep minimal to avoid barrel drift.
 * @runtime Client-safe
 */

export * from './client';

// NOTE:
// - Do not re-export server-only modules or internal helpers here.
// - If a new cross-domain consumer truly needs a symbol via the barrel,
//   add a targeted export above and justify it in the PR to avoid drift.


