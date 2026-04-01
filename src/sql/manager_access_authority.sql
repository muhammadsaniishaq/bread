-- ==============================================================
-- PHASE 31: MANAGER ACCESS AUTHORITY (Final RLS Fix)
-- ==============================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- This grants the MANAGER role full power to create and edit
-- any profile or customer record.
-- ==============================================================

-- 1. Enable RLS (just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 2. Create the Manager Policy for PROFILES
-- Allows Managers to do EVERY action on every row
DROP POLICY IF EXISTS "Managers can manage all profiles" ON public.profiles;
CREATE POLICY "Managers can manage all profiles" ON public.profiles
FOR ALL 
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MANAGER'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MANAGER'
);

-- 3. Create the Manager Policy for CUSTOMERS
DROP POLICY IF EXISTS "Managers can manage all customers" ON public.customers;
CREATE POLICY "Managers can manage all customers" ON public.customers
FOR ALL 
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MANAGER'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MANAGER'
);

-- Note: Ensure your own profile has role = 'MANAGER' in Supabase Profiles table!
-- If you are not a manager, you still won't be able to edit.
