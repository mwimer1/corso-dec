// types/shared/index.ts - Main shared types barrel export
// Explicit exports for better tooling support and clarity

// Core foundational types
export type {
    GetEntityPageDataParams, Row
} from './core/entity/types';

// Auth types
export type {
    Permission
} from '../auth';


export type {
    NavItemData
} from './core/ui/types';

// Custom Clerk types
export type * from './custom-clerk.d';


// Config types
export type { ValidatedEnv } from './config/base/types';

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
    ApiKeyValidation, ConfigValidationHookResult, DomainValidationResult, EmailVerificationValidation, MfaValidation, OauthValidation, PasswordResetValidation, PasswordStrengthValidation, SessionValidation, UserLoginValidation, UserRegistrationValidation, ValidationConfig, ValidationResult, ValidationState
} from '../validators/runtime/types';

export type {
    AllowedColumn, AllowedTableName, WhereCondition
} from '../validators/sql-safety/types';


