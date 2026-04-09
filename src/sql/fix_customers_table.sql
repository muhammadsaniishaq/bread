-- Fix missing columns in customers table
-- Run this in Supabase SQL Editor

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS loyalty_points    INTEGER   DEFAULT 0,
  ADD COLUMN IF NOT EXISTS username          TEXT,
  ADD COLUMN IF NOT EXISTS email             TEXT,
  ADD COLUMN IF NOT EXISTS password          TEXT,
  ADD COLUMN IF NOT EXISTS pin               TEXT,
  ADD COLUMN IF NOT EXISTS image             TEXT,
  ADD COLUMN IF NOT EXISTS notes             TEXT,
  ADD COLUMN IF NOT EXISTS location          TEXT,
  ADD COLUMN IF NOT EXISTS profile_id        UUID,
  ADD COLUMN IF NOT EXISTS assigned_supplier_id UUID,
  ADD COLUMN IF NOT EXISTS debt_balance      NUMERIC DEFAULT 0;
