---
status: "draft"
last_updated: "2025-12-29"
category: "documentation"
title: "Supabase"
description: "Documentation and resources for documentation functionality."
---
# 🗄️ Supabase Database Configuration

> **Note:** This directory contains Supabase database migrations, configuration files, and Row Level Security (RLS) policies for multi-tenant data isolation.

## 📋 Quick Reference

The `supabase` directory manages database schema, migrations, and configuration for the Corso platform. All changes to the database structure are version-controlled through SQL migration files with comprehensive RLS policies for security.

**Key Points:**
- **Migration-Driven**: All schema changes through versioned SQL files
- **Multi-Tenant Security**: Row Level Security for organization and user isolation
- **Local Development**: Full local Supabase stack with Docker
- **Production Sync**: Migrations automatically applied to production
- **SQL Linting**: AST-grep rules for migration validation
- **Real-time Features**: Presence tracking and live data updates

## 📁 Directory Structure

```
supabase/
├── config.toml              # Supabase CLI configuration
├── migrations/              # Database migration files (21 files)
│   ├── 20240101000000_add_chat_messages_table.sql
│   ├── 20240429000000_create_saved_tables.sql
│   ├── 20250115000000_add_checkout_sessions_table.sql
│   ├── 20250129000000_create_saved_searches_table.sql
│   ├── 20250428091024_add_onboarding_columns.sql
│   ├── 20250428091418_add_onboarding_columns.sql
│   ├── 20250501231031_add_saved_views_table.sql
│   ├── 20250502061640_add_saved_views_and_watchlists.sql
│   ├── 20250503000000_add_rls_user_payment_api_keys.sql
│   ├── 20250612000100_create_set_rls_context_function.sql
│   ├── 20250613000100_add_clerk_webhook_events_table.sql
│   ├── 202506141600_dev_metrics.sql
│   ├── 20250615000001_enable_rls_all_remaining.sql
│   ├── 20250615000002_idx_projects.sql
│   ├── 20250615000003_audit_log.sql
│   ├── 20250616000000_enable_rls_org_isolation.sql
│   ├── 20250813120000_add_missing_tenant_indexes.sql
│   ├── 20250813121000_mv_projects_daily_counts.sql
│   └── 20250814090000_presence_v2.sql
├── ast-greprc.yml           # SQL linting rules for migrations
└── README.md                # This documentation
```

**Note:** The `.temp/` directory (Supabase CLI temporary files) is gitignored and should not be committed.

## 🔄 Database Migrations

- [📋 Quick Reference](#-quick-reference)
- [📁 Directory Structure](#-directory-structure)
- [🔄 Database Migrations](#-database-migrations)
- [🔒 Row Level Security](#-row-level-security)
- [⚙️ Configuration](#️-configuration)
- [🛠️ Local Development](#️-local-development)
- [🚀 Production Deployment](#-production-deployment)
- [📊 Database Schema](#-database-schema)
- [🎯 Key Takeaways](#-key-takeaways)
- [📚 Related Documentation](#-related-documentation)
- [🏷️ Tags](#️-tags)

---

## 📁 Directory Structure

```
supabase/
├── config.toml              # Supabase CLI configuration
├── migrations/              # Database migration files
│   ├── 20240101000000_add_chat_messages_table.sql
│   ├── 20240429000000_create_saved_tables.sql
│   ├── 20250115000000_add_checkout_sessions_table.sql
│   ├── 20250428091024_add_onboarding_columns.sql
│   ├── 20250428091418_add_onboarding_columns.sql
│   ├── 20250501231031_add_saved_views_table.sql
│   ├── 20250502061640_add_saved_views_and_watchlists.sql
│   ├── 20250503000000_add_rls_user_payment_api_keys.sql
│   ├── 20250612000100_create_set_rls_context_function.sql
│   ├── 20250613000100_add_clerk_webhook_events_table.sql
│   ├── 202506141600_dev_metrics.sql
│   ├── 20250615000001_enable_rls_all_remaining.sql
│   ├── 20250615000002_idx_projects.sql
│   ├── 20250615000003_audit_log.sql
│   ├── 20250616000000_enable_rls_org_isolation.sql
├── ast-greprc.yml           # SQL linting rules for migrations
└── README.md                # This documentation
```

## 🔄 Database Migrations

### Migration Naming Convention
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

### Current Migration Files (21 total)

#### Core Schema Migrations
- **20240101000000_add_chat_messages_table.sql** - Chat messages table with RLS
- **20240429000000_create_saved_tables.sql** - Saved views, watchlists, and files tables
- **20250115000000_add_checkout_sessions_table.sql** - Stripe checkout session tracking
- **20250129000000_create_saved_searches_table.sql** - User dashboard search queries
- **20250428091024_add_onboarding_columns.sql** - User preferences onboarding columns
- **20250428091418_add_onboarding_columns.sql** - Onboarding step order configuration

#### Security & Access Control
- **20250501231031_add_saved_views_table.sql** - Enhanced saved views (duplicate - see 20240429)
- **20250502061640_add_saved_views_and_watchlists.sql** - Comprehensive saved views/watchlists system
- **20250503000000_add_rls_user_payment_api_keys.sql** - RLS for user data, payments, and API keys

#### Infrastructure & Functions
- **20250612000100_create_set_rls_context_function.sql** - RLS context setting function
- **20250613000100_add_clerk_webhook_events_table.sql** - Webhook idempotency tracking
- **202506141600_dev_metrics.sql** - CI/CD metrics collection

#### Performance & Optimization
- **20250615000001_enable_rls_all_remaining.sql** - Enable RLS on all remaining tables
- **20250615000002_idx_projects.sql** - Project composite indexes
- **20250615000003_audit_log.sql** - Database audit logging system
- **20250616000000_enable_rls_org_isolation.sql** - Organization-level data isolation

#### Analytics & Real-time Features
- **20250813120000_add_missing_tenant_indexes.sql** - Performance indexes for tenant data
- **20250813121000_mv_projects_daily_counts.sql** - Materialized view for project analytics
- **20250814090000_presence_v2.sql** - Real-time user presence tracking

### Running Migrations

```bash
# Apply all pending migrations
supabase db push

# Create new migration
supabase migration new add_new_feature

# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

## 🔒 Row Level Security

### Multi-Tenant and User Isolation
All tables implement RLS policies to ensure organization-level and user-level data isolation. Key policies include:

- **Organization Isolation**: Most org-scoped tables use `org_id = current_setting('app.current_org_id', true)` for access control.
- **User Isolation**: User-scoped tables use `user_id = current_setting('app.current_user_id', true)` or `auth.uid() = user_id`.
- **Service Role**: Service role can bypass RLS for admin operations.

#### Example RLS Policy
```sql
CREATE POLICY "org_isolation_projects" ON projects
  FOR ALL USING (org_id = current_setting('app.current_org_id', true));
```

#### Security Functions
- **set_rls_context(org_id, user_id?)**: Sets organization and user context for RLS policies.
- **Audit Logging**: Triggers and functions log changes to sensitive tables.

#### Best Practices
- ✅ Every table has appropriate org_id or user_id columns
- ✅ RLS policies on all user-accessible tables
- ✅ Service role bypasses RLS for admin operations
- ❌ No direct table access without RLS checks
- ❌ No hard-coded organization IDs in queries

## ⚙️ Configuration

### config.toml (excerpt)
```toml
[api]
enabled           = true
port              = 55421
schemas           = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows          = 1000

[db]
port          = 55432
shadow_port   = 55430
major_version = 15

[auth]
enabled                       = true
site_url                      = "http://localhost:3000"
additional_redirect_urls      = []
jwt_expiry                    = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval  = 10
enable_manual_linking         = true
enable_sign-up                = true
enable_anonymous_sign_ins     = true
minimum_password_length       = 6
password_requirements         = ""
jwt_secret                    = "REPLACE_WITH_32_CHAR_RANDOM_VALUE"
```

See the full `config.toml` for all settings.

## 🛠️ Local Development

### Setup Local Supabase
```bash
# Start local Supabase stack
supabase start

# Check status
supabase status

# View logs
supabase logs

# Stop all services
supabase stop
```

### Database Operations
```bash
# Connect to local database
supabase db connect

# Run SQL queries
psql -h localhost -p 55432 -U postgres -d postgres

# Backup local data
supabase db dump > backup.sql

# Restore from backup
supabase db reset && psql -h localhost -p 55432 -U postgres -d postgres < backup.sql
```

## 🚀 Production Deployment

### Migration Pipeline
1. **Local Testing**: Test migrations on local Supabase instance
2. **Staging Deploy**: Apply to staging environment
3. **Production Deploy**: Automated deployment via CI/CD
4. **Type Generation**: Update TypeScript types after deployment

### Deployment Commands
```bash
# Link to production project
supabase link --project-ref <project-id>

# Push migrations to production
supabase db push --linked

# Generate production types
supabase gen types typescript --linked > types/supabase.ts
```

## 📊 Database Schema

### Core Tables & Relationships

| Table                  | Purpose                                 | RLS Enabled | Key Columns/Notes                |
|------------------------|-----------------------------------------|-------------|----------------------------------|
| **User & Dashboard Data** | | | |
| saved_views            | User dashboard configurations           | ✅          | user_id, org/user isolation      |
| saved_searches         | User dashboard search queries           | ✅          | user_id, name, query             |
| watchlists             | User project watchlists                 | ✅          | user_id, org/user isolation      |
| watchlist_items        | Items in user watchlists                | ✅          | watchlist_id, user_id via join   |
| saved_files            | User file storage                       | ✅          | user_id, org/user isolation      |
| user_preferences       | User onboarding and preferences         | ✅          | onboarding columns, user_id      |
| **Communication & Chat** | | | |
| chat_messages          | AI chat conversation history            | ✅          | user_id, session_id              |
| **Financial & Payments** | | | |
| checkout_sessions      | Stripe payment sessions                 | ✅          | user_id, org_id, idempotency     |
| user_data              | User profile data                       | ✅          | user_id                          |
| payment_history        | User payment history                    | ✅          | user_id                          |
| api_keys               | User API key management                 | ✅          | user_id                          |
| subscriptions          | Subscription records                    | ✅          | org_id, user_id                  |
| org_subscriptions      | Organization subscriptions              | ✅          | org_id                           |
| **Organization Data** | | | |
| projects               | Projects (org-scoped)                   | ✅          | org_id, status, created_at       |
| **System & Analytics** | | | |
| audit_log              | System audit trail                      | -           | table_name, record_id, user_id   |
| dev_metrics            | CI/CD and developer metrics             | ✅          | branch, metric, job, runner      |
| presence               | Real-time user presence tracking        | ✅          | org_id, user_id, status          |
| **Webhook & Events** | | | |
| clerk_webhook_events   | Webhook idempotency tracking            | ✅          | id, processed_at                 |
| **Materialized Views** | | | |
| mv_projects_daily_counts | Pre-aggregated project analytics       | -           | org_id, day, status, count       |

#### Relationships
- `saved_views`, `watchlists`, `saved_files`, `user_data`, `payment_history`, `api_keys`, `user_preferences` all reference `auth.users(id)`
- `watchlist_items` references `watchlists(id)`
- `projects`, `org_subscriptions`, `subscriptions` reference `org_id`
- `chat_messages` reference `user_id` and `session_id`

#### Indexes
- **User filtering**: `idx_saved_views_user_id`, `idx_watchlists_user_id`, `idx_saved_files_user_id`, `idx_user_preferences_user_id`
- **Organization filtering**: `idx_projects_org_status_created`, `idx_org_subscriptions_org_id`, `idx_subscriptions_org_id`
- **Temporal ordering**: `idx_chat_messages_user_created_at`, `idx_saved_searches_created_at`
- **Idempotency**: `clerk_webhook_events_id_idx`, `idx_checkout_sessions_user_id`
- **Performance**: `presence_org_last_seen`, `ux_mv_projects_daily_counts_org_day_status`
- **Stripe integration**: `idx_subscriptions_clerk_id`

## 🎯 Key Takeaways

### SQL Linting & Validation

We use [ast-grep](https://ast-grep.github.io/) for validating SQL migrations with rules defined in `ast-greprc.yml`. This ensures database security and consistency across all migrations.

#### AST-Grep Rules (`ast-greprc.yml`)

```yaml
rules:
  - id: missing-rls-policy
    language: Generic
    rule:
      pattern: CREATE TABLE $TABLE
      not:
        has:
          pattern: CREATE POLICY .* ON $TABLE
    message: Table created without corresponding RLS policy
    severity: warning

  - id: unrestricted-select
    language: Generic
    rule:
      pattern: SELECT .* FROM $TABLE
      not:
        inside:
          pattern: CREATE POLICY
    message: Potential unrestricted SELECT statement - ensure RLS is applied
    severity: warning
```

#### Validation Commands

```bash
# Validate all migration files
ast-grep scan --config supabase/ast-greprc.yml supabase/migrations/

# Check for missing RLS policies
ast-grep run --pattern "CREATE TABLE" --lang generic supabase/migrations/

# Full project SQL validation
pnpm lint:sql
```

#### Key Principles for AI Agents

**🔒 Security First:**
- Every table must have RLS policies
- Use parameterized queries, never string interpolation
- Validate all inputs before database operations
- Audit trail for sensitive operations

**🚀 Performance Optimization:**
- Use appropriate indexes for tenant/org filtering
- Consider materialized views for expensive aggregations
- Monitor query performance in production

**📊 Data Integrity:**
- Foreign key relationships must be properly defined
- Cascade deletes where appropriate
- Use constraints for data validation
- Maintain referential integrity

**🔄 Migration Best Practices:**
- Test migrations on local Supabase before production
- Include rollback strategies for complex changes
- Document breaking changes and migration impact
- Use idempotent operations where possible

**📈 Real-time Features:**
- Presence table for user status tracking
- Proper publication setup for Supabase Realtime
- Efficient heartbeat mechanisms
- Org-scoped real-time subscriptions

**For more details, see [docs/codebase/supabase.md](../docs/codebase/supabase.md).**

### Core Architecture Patterns

- **Migration-First**: All schema changes through versioned SQL files
- **Security-by-Design**: Comprehensive RLS policies for multi-tenant isolation
- **Local Development**: Full local stack with Docker for testing and development
- **Type Safety**: Automatic TypeScript type generation from database schema
- **Real-time Ready**: Presence tracking and live data updates built-in

## 📚 Related Documentation

- [Database Architecture](../docs/platform-architecture/core-infrastructure.md) - Database design patterns
- [Security Guide](../docs/security/access-control.md) - Multi-tenant security implementation
- [API Documentation](../docs/reference/api-reference.md) - Database API patterns
- [Warehouse Query Hooks](../docs/analytics/warehouse-query-hooks.md) - Data fetching patterns
- [Real-time Presence](../docs/features/presence-tracking.md) - Live user status features

## 🏷️ Tags

`#supabase` `#database` `#migrations` `#rls` `#multi-tenant` `#postgresql` `#security` `#real-time` `#analytics` `#presence`

---

**Last updated:** 2025-09-10
**Supabase CLI:** v2.39.2
**Migrations:** 21 total
**Tables:** 18 core + 1 materialized view
**RLS Policies:** 100% coverage
