-- ==============================================================
-- PHASE 29: SECURE CUSTOMER AUTH BRIDGE
-- ==============================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- This function allows people to verify their password BEFORE 
-- logging in, bypassing RLS (Row Level Security) safely.
-- ==============================================================

CREATE OR REPLACE FUNCTION verify_customer_credentials(val_input TEXT, val_password TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Bypasses RLS to see the ledger passwords
AS $$
DECLARE
  found_user JSONB;
BEGIN
  -- 1. Look up by username or email in the customers table
  -- We prioritize the manager-set password or pin
  SELECT jsonb_build_object(
    'id', id,
    'email', COALESCE(email, (username || '@bakery.internal')),
    'name', name,
    'role', 'CUSTOMER',
    'profile_id', profile_id,
    'is_manual', true
  ) INTO found_user
  FROM public.customers
  WHERE (username ILIKE val_input OR email ILIKE val_input)
    AND (password = val_password OR pin = val_password)
  LIMIT 1;

  -- 2. Return found user or NULL if no match
  RETURN found_user;
END;
$$;

-- Grant access to everyone (public/anon) so they can call it at login
GRANT EXECUTE ON FUNCTION verify_customer_credentials(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_customer_credentials(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_customer_credentials(TEXT, TEXT) TO service_role;
