/**
 * @fileoverview Public validator surface
 * @module lib/validators
 * @description Only exports validators used in runtime code. Add @public to intended exports.
 */

// Entity validators
export {
    EntityListQuerySchema, EntityParamSchema, SortDirSchema
} from './entityListQuery';
export type { EntityListQuery, EntityParam, SortDir } from './entityListQuery';

// Entity query validators (POST /api/v1/entity/{entity}/query)
export { EntityQueryRequestSchema } from './entityQuery';
export type { EntityQueryRequest } from './entityQuery';

// Auth validators
export { UserSchema } from './auth/user-validation';

// Entity query validators (only keeping used schemas)

// Mock project validators (JSON fixtures processing)
export {
    CanonicalProject,
    CanonicalProjectsFile, RawProjectRow, toISODateOrNullExport
} from './mock-projects';
export type {
    TCanonicalProject, TRawProjectRow
} from './mock-projects';

// CSP security validators
export {
    cspViolationBodySchema,
    legacyCspReportSchema,
    reportToBatchSchema
} from './security/csp';
export type { CspViolation } from './security/csp';

// Chat security validators
export { validateUserMessage } from './security/chat-validation';
export type { ChatValidationResult } from './security/chat-validation';

// Dashboard warehouse entity validators
export {
    AddressRowSchema,
    BaseRowSchema,
    CompanyRowSchema,
    ProjectRowSchema
} from './dashboard/warehouse-entity-validation';


// Clerk webhook validators
export {
    ClerkEventEnvelope,
    ClerkUserPayload
} from './clerk-webhook';


// Marketing contact validators
export { ContactSchema } from './contact';

// (removed) grid-config schemas were unused

/**
 * Public primitive schemas (compat for callers importing via shared/validation/primitive-schemas)
 * Keep these names in sync with `lib/shared/validation/client.ts` expectations.
 */
export {
    emailSchema,
    nameSchema
} from "./shared/primitives";


