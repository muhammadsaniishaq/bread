-- ==============================================================
-- PHASE 28: CUSTOMER AUTH SYNC MIGRATION
-- ==============================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- This ensures the Manager can actually "Save" passwords and 
-- usernames to the database so customers can log in.
-- ==============================================================

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS password TEXT;

-- Index for faster login lookups (Optional but Recommended)
CREATE INDEX IF NOT EXISTS idx_customers_username ON public.customers (username);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers (email);

-- Update RLS (Row Level Security) if needed to allow the manager to read these.
-- Since they belong to public.customers, ensure your existing policies 
-- allow authenticated users (like Managers) to SELECT these columns.

COMMENT ON COLUMN public.customers.password IS 'Manager-set access password for portal login fallback.';
