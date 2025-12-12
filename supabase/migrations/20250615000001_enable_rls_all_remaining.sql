-- 20250615000001_enable_rls_all_remaining.sql
-- Enable RLS for remaining public tables and add default org policies

-- Enable RLS on tables currently without RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clerk_webhook_events ENABLE ROW LEVEL SECURITY;

-- Add default organization scope policy
CREATE POLICY org_scope_default ON public.org_subscriptions FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY org_scope_default ON public.projects FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY org_scope_default ON public.checkout_sessions FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);
