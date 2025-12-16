// Server Actions - Direct component calls for form submissions and simple mutations
// See actions/README.md for usage and docs/architecture/actions-vs-api-routes.md for when to use actions vs API routes

// Marketing actions
export * from "./marketing/contact-form";

// Migration notes:
// - Chat/SQL generation: Migrated to /app/api/v1/ai/* (streaming, OpenAPI documented)
// - Billing actions: Removed (handled by Clerk Billing)
// - Entity queries: Use /app/api/v1/entity/{entity}/query (API routes)
