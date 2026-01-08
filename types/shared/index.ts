// types/shared/index.ts - Main shared types barrel export
// Explicit exports for better tooling support and clarity
//
// NOTE: Shared exports are for truly cross-cutting primitives (dates, UI nav, etc).
// Avoid re-exporting domain-owned types (auth, chat, security) to prevent cycles.
// Import domain types directly from their canonical locations instead.

// Core foundational types
export type {
    Row
} from './core/entity/types';

export type {
    NavItemData,
    BreadcrumbItem
} from './core/ui/types';

// Config types
export type { ValidatedEnv } from './config/types';

// Feature flags types
export type {
    FeatureFlagConfig
} from './feature-flags/types';


// System types
// Event types removed - unused exports (DomainEvent, EventHandler, ChatAIErrorPayload, ChatMessageProcessedPayload)

// Date types
export type {
    ISODateString
} from './dates/types';

// Validation types
export type {
    DomainValidationResult
} from './validation/types';


