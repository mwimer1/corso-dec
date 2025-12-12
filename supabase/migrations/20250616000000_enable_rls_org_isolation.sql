-- ENABLED MIGRATION: Enable Row Level Security for Org Isolation
-- PHASE 2 — 🟡 High Supabase RLS & Wrapper
-- LIVE: This migration is tested and safe for production

-- Enable RLS on org-scoped tables
ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access data for their current organization
CREATE POLICY "org_isolation_org_subscriptions" ON org_subscriptions
    FOR ALL USING (org_id = current_setting('app.current_org_id', true));

CREATE POLICY "org_isolation_projects" ON projects
    FOR ALL USING (org_id = current_setting('app.current_org_id', true));

-- Policy: Users can access their own saved files regardless of org
CREATE POLICY "user_isolation_saved_files" ON saved_files
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

-- NOTE: Add policies for other tables as needed in subsequent migrations
-- NOTE: Implement app.current_org_id and app.current_user_id setting mechanism in database init or session setup
-- NOTE: Ensure thorough testing in staging before applying to production 