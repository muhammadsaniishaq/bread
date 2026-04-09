-- ═══════════════════════════════════════════════════════════════
-- DROP existing functions first (to allow return type changes)
-- ═══════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS verify_customer_credentials(text, text);
DROP FUNCTION IF EXISTS create_customer_account(text, text, text, text, text, text);
DROP FUNCTION IF EXISTS get_email_for_username(text);

-- Creates a full Supabase auth user + profile + customer record
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION create_customer_account(
  p_email    TEXT,
  p_password TEXT,
  p_name     TEXT,
  p_phone    TEXT    DEFAULT '',
  p_username TEXT    DEFAULT '',
  p_location TEXT    DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_uid  UUID := gen_random_uuid();
  v_now  TIMESTAMPTZ := now();
  v_email TEXT := LOWER(TRIM(p_email));
BEGIN
  -- 1. Create auth user
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    v_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    v_email,
    crypt(p_password, gen_salt('bf')),
    v_now,
    jsonb_build_object(
      'role',      'CUSTOMER',
      'full_name', p_name,
      'phone',     p_phone,
      'username',  p_username
    ),
    v_now, v_now, '', '', '', ''
  );

  -- 2. Create auth identity (needed for email login)
  INSERT INTO auth.identities (
    id, user_id, provider_id,
    identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_uid::text, v_uid, v_email,
    jsonb_build_object('sub', v_uid::text, 'email', v_email),
    'email',
    v_now, v_now, v_now
  );

  -- 3. Create profile row
  INSERT INTO public.profiles (id, full_name, phone, username, role)
  VALUES (v_uid, p_name, p_phone, p_username, 'CUSTOMER')
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone     = EXCLUDED.phone,
    username  = EXCLUDED.username;

  -- 4. Create customer record linked to auth user
  INSERT INTO public.customers (
    id, profile_id, name, email,
    phone, username, location,
    debt_balance, loyalty_points
  ) VALUES (
    v_uid, v_uid, p_name, v_email,
    p_phone, p_username, p_location,
    0, 0
  )
  ON CONFLICT (id) DO UPDATE SET
    profile_id = EXCLUDED.profile_id,
    name       = EXCLUDED.name,
    phone      = EXCLUDED.phone,
    username   = EXCLUDED.username,
    location   = EXCLUDED.location;

  RETURN json_build_object(
    'id',    v_uid,
    'email', v_email,
    'name',  p_name
  );

EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'An account with this email already exists';
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- FUNCTION 2: verify_customer_credentials
-- Used for username/phone/email + password login (legacy path)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION verify_customer_credentials(
  val_input    TEXT,
  val_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cust RECORD;
BEGIN
  SELECT * INTO cust
  FROM public.customers
  WHERE (
    LOWER(username) = LOWER(TRIM(val_input)) OR
    LOWER(email)    = LOWER(TRIM(val_input)) OR
    phone           = TRIM(val_input)
  )
  AND password = val_password
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'id',    cust.id,
    'name',  cust.name,
    'email', cust.email,
    'role',  'CUSTOMER'
  );
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- FUNCTION 3: get_email_for_username (if not already exists)
-- Resolves username to email for login
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_email_for_username(lookup_user TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Check profiles table first
  SELECT au.email INTO v_email
  FROM auth.users au
  JOIN public.profiles p ON p.id = au.id
  WHERE LOWER(p.username) = LOWER(TRIM(lookup_user))
  LIMIT 1;

  IF v_email IS NOT NULL THEN
    RETURN v_email;
  END IF;

  -- Check customers table
  SELECT email INTO v_email
  FROM public.customers
  WHERE LOWER(username) = LOWER(TRIM(lookup_user))
    AND email IS NOT NULL
  LIMIT 1;

  RETURN v_email;
END;
$$;
