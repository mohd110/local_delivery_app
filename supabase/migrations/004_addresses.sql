-- ============================================================
-- Restaurant Direct — Saved delivery addresses (multi-address book)
-- Run AFTER 003_delivery_coords.sql. Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.addresses (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label       TEXT    NOT NULL DEFAULT 'Home',
  address     TEXT    NOT NULL,
  landmark    TEXT,
  pincode     TEXT    NOT NULL,
  latitude    DECIMAL(10,8),
  longitude   DECIMAL(11,8),
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses_select_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_insert_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_update_own" ON public.addresses;
DROP POLICY IF EXISTS "addresses_delete_own" ON public.addresses;

CREATE POLICY "addresses_select_own"
  ON public.addresses FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "addresses_insert_own"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "addresses_update_own"
  ON public.addresses FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "addresses_delete_own"
  ON public.addresses FOR DELETE
  USING (auth.uid() = customer_id);

-- Verify
SELECT count(*) AS addresses_table_rows FROM public.addresses;
