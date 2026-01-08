---
title: "ADR 001: Server-Side Chat History Persistence"
description: "Documentation and resources."
last_updated: "2026-01-07"
category: "documentation"
---
# ADR 001: Server-Side Chat History Persistence

**Status:** Proposed  
**Date:** 2026-01-XX  
**Authors:** Platform Team  
**Related:** [Comprehensive Dashboard + Chat Implementation Plan](../../.cursor/implementation-plan/comprehensive-dashboard-chat-todos.md)

## Context

Currently, chat history is stored only in browser `localStorage`, which:
- Is cleared when users clear browser data
- Doesn't sync across devices
- Cannot be accessed for analytics or support
- May be lost on shared devices (mitigated by user/org scoping in Sprint 1)

## Decision

**Design a server-side chat persistence system** as an optional feature that can be enabled per organization or user tier.

## Scope

### Included
- Optional server-side storage of chat messages
- Per-organization feature flag
- Retention policy with configurable duration
- Basic schema for message storage
- Migration path from localStorage-only to server-backed

### Not Included (Future)
- Message search across history
- Chat export functionality
- Cross-device synchronization UI
- Message editing/deletion
- Chat sharing

## Schema Assumptions

### Database Schema (Supabase/PostgreSQL)

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Clerk userId
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  metadata JSONB DEFAULT '{}', -- Tool calls, detected tables, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_chat_messages_org_user ON chat_messages(org_id, user_id, created_at DESC),
  INDEX idx_chat_messages_retention ON chat_messages(created_at) WHERE created_at < NOW() - INTERVAL '90 days'
);

-- Retention policy: soft delete after 90 days (configurable)
CREATE POLICY chat_messages_retention ON chat_messages
  FOR DELETE
  USING (created_at < NOW() - INTERVAL '90 days');
```

### API Endpoints

**GET `/api/v1/ai/chat/history`**
- Returns paginated chat history for authenticated user
- Scoped to user's organization
- Query params: `page`, `pageSize`, `before` (timestamp)

**POST `/api/v1/ai/chat/history`**
- Saves chat message (called after each message exchange)
- Idempotent (message ID prevents duplicates)

**DELETE `/api/v1/ai/chat/history/:messageId`**
- Soft delete individual message (user-initiated)

## Privacy & Retention Policy

### Retention
- **Default:** 90 days
- **Configurable:** Per-organization setting (30, 60, 90, 180, 365 days)
- **Auto-deletion:** Automated cleanup via scheduled job

### GDPR Considerations
- **Right to deletion:** Users can delete their chat history via API
- **Data portability:** Export functionality (future)
- **PII minimization:** Only store user ID (from Clerk), not names/emails
- **Encryption at rest:** Standard database encryption

### Compliance
- Chat messages may contain PII (user queries about addresses, names, etc.)
- Must comply with data retention policies
- Audit logs for message access (admin/support)

## Migration/Rollout Plan

### Phase 1: Feature Flag (Optional)
1. Add feature flag: `chat.serverPersistence.enabled` (default: `false`)
2. Implement API endpoints (disabled behind flag)
3. Add UI toggle in settings (admin-only initially)

### Phase 2: Opt-In Beta
1. Enable for select organizations (manual opt-in)
2. Monitor database growth and query performance
3. Gather user feedback

### Phase 3: Gradual Rollout
1. Enable for all organizations (opt-out available)
2. Migrate existing localStorage history (one-time sync)
3. Default to server-backed storage

### Migration Strategy
- **Dual-write:** Save to both localStorage and server during migration
- **Sync on load:** Merge server + localStorage history (server takes precedence)
- **Cleanup:** Remove localStorage migration code after 1 release

## Risks

### Cost
- **Storage:** ~1KB per message × 1000 messages/user = 1MB/user
- **At scale:** 10K users × 1000 messages = 10GB (manageable)
- **Database queries:** Index on `(org_id, user_id, created_at)` ensures fast queries

### Performance
- **Write latency:** Async save (non-blocking) to avoid chat delay
- **Read latency:** Paginated loading (first 50 messages, then load more)
- **Impact:** Minimal if implemented with proper indexing

### Privacy
- **PII exposure:** Chat messages may contain sensitive data
- **Mitigation:** Encryption at rest, access controls, audit logs

### Compliance Risks
- **GDPR:** Right to deletion must be supported
- **Retention:** Must honor organization retention policies
- **Audit:** Admin access to messages must be logged

## Alternatives Considered

### 1. localStorage + Sync API (Rejected)
- **Pros:** Simpler, no server storage
- **Cons:** Still requires server for sync, doesn't solve cross-device issue

### 2. Client-side encryption + server storage (Future)
- **Pros:** Enhanced privacy (server can't read messages)
- **Cons:** Complex key management, impacts search/analytics

### 3. Third-party service (e.g., Firebase) (Rejected)
- **Pros:** Managed service
- **Cons:** Vendor lock-in, cost, compliance concerns

## Success Metrics

- **Adoption:** % of organizations with feature enabled
- **Storage growth:** Messages stored per day
- **Query performance:** P95 latency for history load
- **User satisfaction:** Feedback on cross-device sync

## Implementation Notes

- Use existing Supabase infrastructure
- Leverage RBAC for access control (users can only access their own messages)
- Implement soft deletes (mark as deleted, retain for audit)
- Use feature flag system (`lib/server/feature-flags`) for rollout control

## References

- [Comprehensive Dashboard + Chat Implementation Plan](../../.cursor/implementation-plan/comprehensive-dashboard-chat-todos.md)
- [Security Standards](../../.cursor/rules/security-standards.mdc)
- [Feature Flags Documentation](../architecture/feature-flags.md)
