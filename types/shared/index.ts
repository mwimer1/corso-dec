// types/shared/index.ts - Main shared types barrel export
// Explicit exports for better tooling support and clarity
//
// NOTE: Shared exports are for truly cross-cutting primitives (dates, UI nav, etc).
// Avoid re-exporting domain-owned types (auth, chat, security) to prevent cycles.
// Import domain types directly from their canonical locations instead.

// Core foundational types
export type {
    GetEntityPageDataParams, Row
} from './core/entity/types';

export type {
    NavItemData
} from './core/ui/types';

// Config types
export type { ValidatedEnv } from './config/types';

// Feature flags types
export type {
    FeatureFlagConfig
} from './feature-flags/types';


// System types
// Error types removed - unused exports from types/shared/system/error/types.ts

export type {
    ChatAIErrorPayload, ChatMessageProcessedPayload, DomainEvent,
    EventHandler
} from './system/events/types';

// Utils types
export type {
    ISODateString
} from './utils/dates/types';

// Validation types
export type {
    ConfigValidationHookResult,
    DomainValidationResult,
    ValidationState
} from './validation/types';


