// Marketing types barrel - explicit exports
export type { Contact } from './contact/types';
export type { InsightItem, InsightPreview } from './insights/types';
export type { ChartDataPoint } from './landing/types';

// Use Cases
export { zUseCaseMap } from './use-cases';
export type { UseCase, UseCaseKey } from './use-cases';

// Re-export common types
export type { ISODateString } from '../shared/dates/types';

// Note: Permit Data types are exported from lib/marketing/permit-data/schemas.ts
// Import them directly: import type { PermitDataPage } from '@/lib/marketing/permit-data/schemas';


