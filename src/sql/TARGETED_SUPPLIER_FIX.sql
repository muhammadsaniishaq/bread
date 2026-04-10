-- ══════════════════════════════════════════════════════════════════
-- 🛠️ TARGETED SUPPLIER FIX: muhammadsaniisyaku3@gmail.com
-- Run this in Supabase SQL Editor to manually link the account.
-- ══════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Get the Auth ID for this email
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'muhammadsaniisyaku3@gmail.com';

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User muhammadsaniisyaku3@gmail.com not found in auth.users';
        RETURN;
    END IF;

    -- 2. Ensure Profile exists with SUPPLIER role
    INSERT INTO public.profiles (id, full_name, username, email, role)
    VALUES (
        v_user_id, 
        'Muhammad Sani', 
        'muhammadsani', 
        'muhammadsaniisyaku3@gmail.com', 
        'SUPPLIER'::user_role
    )
    ON CONFLICT (id) DO UPDATE 
    SET role = 'SUPPLIER'::user_role;

    -- 3. Ensure Customer Record exists (linked to profile)
    INSERT INTO public.customers (id, profile_id, name, email, debt_balance)
    VALUES (
        v_user_id, 
        v_user_id, 
        'Muhammad Sani', 
        'muhammadsaniisyaku3@gmail.com', 
        0
    )
    ON CONFLICT (profile_id) DO UPDATE 
    SET email = EXCLUDED.email;

    -- 4. Update Auth Metadata to force Role to SUPPLIER (Optional but recommended)
    -- Note: This requires the user to log out and back in.
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || '{"role": "SUPPLIER"}'::jsonb
    WHERE id = v_user_id;

    RAISE NOTICE 'Account muhammadsaniisyaku3@gmail.com successfully linked as SUPPLIER.';
END $$;

-- Verify
SELECT id, email, role FROM public.profiles WHERE email = 'muhammadsaniisyaku3@gmail.com';
SELECT id, profile_id, name FROM public.customers WHERE email = 'muhammadsaniisyaku3@gmail.com';
