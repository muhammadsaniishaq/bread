-- ==============================================================
-- PHASE 30: UNIVERSAL BAKERY DATABASE FIX
-- ==============================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- This script fixes all columns, constraints, and relationships.
-- Safe to run multiple times.
-- ==============================================================

-- 1. Ensure Customers table has all Auth columns
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS profile_id UUID;

-- 2. Ensure Profiles table has the correct structure for linking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- 3. Add Unique constraint to profiles.username if missing
-- (This allows the Auto-Link feature to work reliably)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- 4. Update the Secure Auth Bridge (RPC) to be even more robust
CREATE OR REPLACE FUNCTION verify_customer_credentials(val_input TEXT, val_password TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_user JSONB;
BEGIN
  -- Search by Username or Email (Case-Insensitive)
  -- Match against Password or PIN (Case-Sensitive)
  SELECT jsonb_build_object(
    'id', id,
    'email', COALESCE(email, (username || '@bakery.internal')),
    'name', name,
    'role', 'CUSTOMER',
    'is_manual', true
  ) INTO found_user
  FROM public.customers
  WHERE (username ILIKE val_input OR email ILIKE val_input)
    AND (password = val_password OR pin = val_password)
  LIMIT 1;

  RETURN found_user;
END;
$$;

-- 5. Re-grant permissions
GRANT EXECUTE ON FUNCTION verify_customer_credentials(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_customer_credentials(TEXT, TEXT) TO authenticated;

-- Success! You can now link accounts seamlessly.
