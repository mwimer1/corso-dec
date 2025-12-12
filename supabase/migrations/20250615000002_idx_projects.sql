-- 20250615000002_idx_projects.sql
-- Add composite index for project queries by org/status/date

CREATE INDEX CONCURRENTLY idx_projects_org_status_created
ON projects (org_id, status, created_at DESC);
