-- ══════════════════════════════════════════════════════════════════
-- 🔧 MASTER FIX — "Profile Unlinked" & Wrong Role Issues
-- Run this ENTIRE script in Supabase SQL Editor (paste all at once)
-- ══════════════════════════════════════════════════════════════════

-- ── STEP 1: See ALL auth users and their current status ────────────
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'role'      AS meta_role,
  au.raw_user_meta_data->>'full_name' AS meta_name,
  p.role                               AS profile_role,
  p.full_name                          AS profile_name,
  p.username                           AS profile_username,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE ROW'
    WHEN p.role IS NULL THEN '⚠️  ROLE IS NULL'
    ELSE '✅ OK'
  END AS status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;


-- ── STEP 2: Auto-create missing profile rows from metadata ─────────
INSERT INTO public.profiles (id, full_name, username, email, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email,'@',1)),
  COALESCE(au.raw_user_meta_data->>'username',  split_part(au.email,'@',1)),
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'CUSTOMER')::user_role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;


-- ── STEP 3: Fix any profile rows where role IS NULL ────────────────
UPDATE public.profiles p
SET role = COALESCE(
  (SELECT (au.raw_user_meta_data->>'role')::user_role 
   FROM auth.users au 
   WHERE au.id = p.id 
     AND au.raw_user_meta_data->>'role' IN ('MANAGER','SUPPLIER','STORE_KEEPER','CUSTOMER')),
  'CUSTOMER'::user_role
)
WHERE p.role IS NULL;


-- ── STEP 4: Ensure RLS allows users to read their OWN profile ──────
-- (Needed so AuthContext can read the role column)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile"     ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Managers read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers write all profiles" ON public.profiles;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Managers read all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'MANAGER')
  );

CREATE POLICY "Managers write all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'MANAGER')
  );


-- ── STEP 5: Fix customers table RLS ────────────────────────────────
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers read own record"    ON public.customers;
DROP POLICY IF EXISTS "Customers insert own record"  ON public.customers;
DROP POLICY IF EXISTS "Customers update own record"  ON public.customers;
DROP POLICY IF EXISTS "Staff read all customers"     ON public.customers;
DROP POLICY IF EXISTS "Staff manage all customers"   ON public.customers;

CREATE POLICY "Customers read own record" ON public.customers
  FOR SELECT USING (auth.uid() = profile_id OR auth.uid() = id);

CREATE POLICY "Customers insert own record" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = profile_id OR auth.uid() = id);

CREATE POLICY "Customers update own record" ON public.customers
  FOR UPDATE USING (auth.uid() = profile_id OR auth.uid() = id);

CREATE POLICY "Staff read all customers" ON public.customers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('MANAGER','STORE_KEEPER','SUPPLIER'))
  );

CREATE POLICY "Staff manage all customers" ON public.customers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('MANAGER','STORE_KEEPER'))
  );


-- ── STEP 6: VERIFY — See final state of all profiles ──────────────
SELECT id, full_name, username, email, role 
FROM public.profiles 
ORDER BY role, full_name;
