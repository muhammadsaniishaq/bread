-- ═══════════════════════════════════════════════════════════════
-- SQL FIX: ROW LEVEL SECURITY (RLS) & PERMISSIONS
-- This script ensures that Customers can see their own data
-- and Managers can manage everything.
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Ensure RLS is enabled on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES FOR 'profiles' TABLE

-- Allow everyone to see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow Managers and Store Keepers to see all profiles
DROP POLICY IF EXISTS "Managers/Keepers can view all profiles" ON profiles;
CREATE POLICY "Managers/Keepers can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('MANAGER', 'STORE_KEEPER')
    )
  );

-- Allow Managers to update profiles
DROP POLICY IF EXISTS "Managers can update profiles" ON profiles;
CREATE POLICY "Managers can update profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'MANAGER'
    )
  );

-- 3. POLICIES FOR 'customers' TABLE

-- Allow Customers to view their own record
DROP POLICY IF EXISTS "Customers can view their own record" ON customers;
CREATE POLICY "Customers can view their own record" ON customers
  FOR SELECT USING (auth.uid() = profile_id OR auth.uid() = id);

-- Allow Customers to insert their own record (for auto-linking)
DROP POLICY IF EXISTS "Customers can insert their own record" ON customers;
CREATE POLICY "Customers can insert their own record" ON customers
  FOR INSERT WITH CHECK (auth.uid() = profile_id OR auth.uid() = id);

-- Allow Customers to update their own basic info
DROP POLICY IF EXISTS "Customers can update their own info" ON customers;
CREATE POLICY "Customers can update their own info" ON customers
  FOR UPDATE USING (auth.uid() = profile_id OR auth.uid() = id);

-- Allow Managers, Store Keepers, and Suppliers to see all customers
DROP POLICY IF EXISTS "Staff can view all customers" ON customers;
CREATE POLICY "Staff can view all customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('MANAGER', 'STORE_KEEPER', 'SUPPLIER')
    )
  );

-- Allow Managers and Store Keepers to perform all actions on customers
DROP POLICY IF EXISTS "Managers/Keepers can manage customers" ON customers;
CREATE POLICY "Managers/Keepers can manage customers" ON customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('MANAGER', 'STORE_KEEPER')
    )
  );

-- 4. FIX ENUM (Just in case)
-- If 'CUSTOMER' is missing from user_role, this will add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'CUSTOMER') THEN
        ALTER TYPE user_role ADD VALUE 'CUSTOMER';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- Type doesn't exist, ignore
END $$;
