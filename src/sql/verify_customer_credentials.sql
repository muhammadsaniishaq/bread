-- ==============================================================
-- PHASE 35: UNIFIED PROFILE LINKING (ID Sync)
-- ==============================================================
-- This fixes the "Profile Unlinked" error.
-- We must return the PROFILE_ID as the main "id" for the session.
-- ==============================================================

CREATE OR REPLACE FUNCTION verify_customer_credentials(val_input TEXT, val_password TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', COALESCE(c.profile_id::text, c.id), -- Use Profile UUID if available!
    'email', COALESCE(c.email, (c.username || '@bakery.internal')),
    'name', c.name,
    'role', COALESCE(p.role, 'CUSTOMER'),
    'profile_id', c.profile_id,
    'is_manual', true
  ) INTO found_user
  FROM public.customers c
  LEFT JOIN public.profiles p ON c.profile_id = p.id
  WHERE (c.username ILIKE val_input OR c.email ILIKE val_input)
    AND (c.password = val_password OR c.pin = val_password)
  LIMIT 1;

  RETURN found_user;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION verify_customer_credentials(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_customer_credentials(TEXT, TEXT) TO authenticated;
