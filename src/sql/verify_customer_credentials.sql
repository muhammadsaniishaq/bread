-- ==============================================================
-- PHASE 33: ULTIMATE AUTH BRIDGE (Dynamic Roles)
-- ==============================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- This function identifies a user and gets their REAL role from 
-- the profiles table, avoiding hardcoded "Customer" redirects.
-- ==============================================================

CREATE OR REPLACE FUNCTION verify_customer_credentials(val_input TEXT, val_password TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user JSONB;
BEGIN
  -- Search by Username or Email (Case-Insensitive)
  -- Join with profiles to get the correct ROLE
  SELECT jsonb_build_object(
    'id', c.id,
    'email', COALESCE(c.email, (c.username || '@bakery.internal')),
    'name', c.name,
    'role', COALESCE(p.role, 'CUSTOMER'), -- Get the actual role from profiles!
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
