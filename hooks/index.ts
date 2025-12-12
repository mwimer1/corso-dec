// hooks/index.ts
// Main barrel export for all domain-specific hooks (80+ hooks across 8 domains)
// Auth, Billing, Chat, Integrations, Marketing & Security hooks consolidated in root
// Dashboard hooks in dedicated subdirectory for better organization
// Shared cross-cutting hooks: config, device, network, ui, analytics, async, mutations, monitoring, streaming

// Chat hooks
export { useChat } from './chat/use-chat';

// Marketing
export { useABTest, useAnalyticsTracking, useCampaignData } from './marketing/marketing-hooks';

// Security
export { useSecurityAudit } from './security/security-hooks';

// Shared (cross-cutting) — separate barrel to avoid cycles
export * from './shared';


