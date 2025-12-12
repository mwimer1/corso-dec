-- Create set_rls_context function for RLS enforcement
CREATE OR REPLACE FUNCTION set_rls_context(org_id text, user_id text DEFAULT NULL) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_org_id', org_id, true);
  IF user_id IS NOT NULL THEN
    PERFORM set_config('app.current_user_id', user_id, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 