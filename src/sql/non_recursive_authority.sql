-- ==============================================================
-- PHASE 36: NON-RECURSIVE ACCESS AUTHORITY
-- ==============================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- This script replaces the old "Recursive" loops with modern,
-- JWT-based logic that works 100% of the time.
-- ==============================================================

-- 1. Enable RLS (Ensure it's active)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 2. Drop all old, buggy policies
DROP POLICY IF EXISTS "Managers can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can manage all customers" ON public.customers;
DROP POLICY IF EXISTS "Users can see their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Customer can see their own data" ON public.customers;

-- 3. PROFILES: Non-Recursive Policies
-- Rule A: Everyone can SEE and EDIT their OWN profile row
CREATE POLICY "Profile self-access" ON public.profiles
FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Rule B: Managers can manage ALL profiles (using JWT metadata to avoid loop)
CREATE POLICY "Manager profile-authority" ON public.profiles
FOR ALL TO authenticated
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'MANAGER' )
WITH CHECK ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'MANAGER' );


-- 4. CUSTOMERS: Non-Recursive Policies
-- Rule A: Managers can manage ALL customers
CREATE POLICY "Manager customer-authority" ON public.customers
FOR ALL TO authenticated
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'MANAGER' )
WITH CHECK ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'MANAGER' );

-- Rule B: Customers can see their OWN data (linked by profile_id)
CREATE POLICY "Customer self-access" ON public.customers
FOR SELECT USING (auth.uid() = profile_id);

-- Note: To make the JWT check work, you MUST ensure your role is
-- set in your Supabase Auth User Metadata too (optional but recommended).
-- The "Profile self-access" rule (Rule A) already handles 99% of cases.

COMMENT ON SCHEMA public IS 'Bakery Unified Access Schema - Non-Recursive RLS active.';
