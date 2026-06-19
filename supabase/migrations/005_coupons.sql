-- ============================================================
-- Restaurant Direct — Coupons
-- Run AFTER 004_addresses.sql. Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.coupons (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT    NOT NULL UNIQUE,
  discount_amount INTEGER NOT NULL CHECK (discount_amount > 0),
  min_order_value INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_select_active" ON public.coupons;
CREATE POLICY "coupons_select_active"
  ON public.coupons FOR SELECT
  USING (is_active = true);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code     TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;

-- Demo coupon so you can test the banner immediately
INSERT INTO public.coupons (code, discount_amount, min_order_value, is_active)
VALUES ('FLAT50', 50, 100, true)
ON CONFLICT (code) DO NOTHING;

-- Verify
SELECT * FROM public.coupons;
