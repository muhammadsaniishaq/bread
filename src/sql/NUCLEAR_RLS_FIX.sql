-- ══════════════════════════════════════════════════════════════════
-- ☢️ THE NUCLEAR RLS FIX — RECURSION ELIMINATOR
-- ══════════════════════════════════════════════════════════════════

-- 1. Goge dukkan tsofaffin dokokin PROFILES da CUSTOMERS (Clean Slate)
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers write all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Users read own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Users update own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Managers manage all" ON public.profiles;

DROP POLICY IF EXISTS "Customers read own record" ON public.customers;
DROP POLICY IF EXISTS "Customers insert own record" ON public.customers;
DROP POLICY IF EXISTS "Customers update own record" ON public.customers;
DROP POLICY IF EXISTS "Staff read all customers" ON public.customers;
DROP POLICY IF EXISTS "Staff manage all customers" ON public.customers;
DROP POLICY IF EXISTS "Customers: Users read own" ON public.customers;
DROP POLICY IF EXISTS "Customers: Users insert own" ON public.customers;
DROP POLICY IF EXISTS "Customers: Users update own" ON public.customers;
DROP POLICY IF EXISTS "Customers: Staff read all" ON public.customers;
DROP POLICY IF EXISTS "Customers: Managers manage all" ON public.customers;

-- 2. Samar da Secure Functions (Wadannan sun tsallake RLS don kaucewa Recursion)
CREATE OR REPLACE FUNCTION public.check_is_manager()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'MANAGER';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.check_is_staff()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('MANAGER', 'STORE_KEEPER', 'SUPPLIER');
END;
$$ LANGUAGE plpgsql;

-- 3. Sake Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 4. Rebuild PROFILES Policies (Non-Recursive)
CREATE POLICY "Profiles: Users read own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Profiles: Users update own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles: Users insert own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles: Managers manage all" ON public.profiles
  FOR ALL USING (public.check_is_manager());

-- 5. Rebuild CUSTOMERS Policies (Non-Recursive)
CREATE POLICY "Customers: Users read own" ON public.customers
  FOR SELECT USING (auth.uid() = profile_id OR auth.uid() = id);

CREATE POLICY "Customers: Users insert own" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = profile_id OR auth.uid() = id);

CREATE POLICY "Customers: Users update own" ON public.customers
  FOR UPDATE USING (auth.uid() = profile_id OR auth.uid() = id);

CREATE POLICY "Customers: Staff read all" ON public.customers
  FOR SELECT USING (public.check_is_staff());

CREATE POLICY "Customers: Managers manage all" ON public.customers
  FOR ALL USING (public.check_is_manager());

-- Final Check
SELECT 'RLS Fixed!' as status;
