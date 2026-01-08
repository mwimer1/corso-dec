// Explicit named exports for better tooling support and clarity
// Authorization types (custom RBAC system that extends Clerk)
export type { Permission, Role, UserRole } from './authorization/types';

// Note: Removed exports for User, SessionConfig/SessionData, UserLoginValidation/UserRegistrationValidation
// These are handled by Clerk (@clerk/nextjs) and don't need custom type definitions


