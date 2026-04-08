-- ================================================================
-- CREATE PRODUCTS TABLE IN SUPABASE
-- Run once in: Supabase Dashboard → SQL Editor → New Query → Run
-- After this, the Manager adds products normally via the app.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  price       NUMERIC NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  stock       INTEGER NOT NULL DEFAULT 0,
  category    TEXT,
  image       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read products
CREATE POLICY "Authenticated can read products"
  ON public.products FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can manage products (Manager adds/edits via app)
CREATE POLICY "Authenticated can manage products"
  ON public.products FOR ALL
  USING (auth.role() = 'authenticated');

-- ================================================================
-- Done! Manager can now add products through the app.
-- Products will be saved directly to Supabase.
-- ================================================================
