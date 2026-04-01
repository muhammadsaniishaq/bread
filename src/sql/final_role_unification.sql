-- ==============================================================
-- PHASE 33: FINAL ROLE UNIFICATION (Supplier vs Manager)
-- ==============================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- This ensures your specific accounts have the right roles.
-- ==============================================================

-- 1. Restore Supplier Role
-- Replace 'SUNANKA' with the Supplier Username
UPDATE public.profiles 
SET role = 'SUPPLIER' 
WHERE username ILIKE 'Kaine' OR full_name ILIKE '%Kaine%';

-- 2. Restore Manager Role
-- Replace 'ADMIN' with your Manager Username
UPDATE public.profiles 
SET role = 'MANAGER' 
WHERE username ILIKE 'Manager' OR full_name ILIKE '%Admin%';

-- 3. Sync Roles to Customer Ledger (If they exist there)
UPDATE public.customers c
SET role = p.role
FROM public.profiles p
WHERE c.profile_id = p.id;

-- 4. Check the results
SELECT id, full_name, username, role 
FROM public.profiles 
WHERE role IN ('MANAGER', 'SUPPLIER');
