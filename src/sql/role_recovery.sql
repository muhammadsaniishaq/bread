-- ==============================================================
-- PHASE 32: ROLE RECOVERY UTILITY
-- ==============================================================
-- Run this in your Supabase SQL Editor if you are being 
-- redirected to the wrong dashboard (e.g., getting Manager 
-- instead of Supplier).
-- ==============================================================

-- 1. Set your role back to SUPPLIER
-- REPLACE 'Kaine' with your actual Username or Email
UPDATE public.profiles 
SET role = 'SUPPLIER' 
WHERE username = 'Kaine' OR full_name ILIKE '%Kaine%';

-- 2. Ensure your own Manager account stays as MANAGER
-- (Double check your own username here)
UPDATE public.profiles 
SET role = 'MANAGER' 
WHERE username = 'Manager' OR full_name ILIKE '%Admin%';

-- 3. Verify the changes
SELECT id, full_name, username, role FROM public.profiles;
