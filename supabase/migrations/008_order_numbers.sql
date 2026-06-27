-- ============================================================
-- Restaurant Direct — Human-readable daily order numbers
-- Format: BB-DD/MM/YY-0001 — resets to 0001 at the start of each
-- calendar day (IST), increments per order placed that day.
-- Run AFTER 007_complaints.sql. Safe to re-run.
-- ============================================================

-- One row per calendar day, holding the last sequence number issued.
-- A trigger-based atomic upsert (below) avoids race conditions when
-- two orders are placed in the same second.
CREATE TABLE IF NOT EXISTS public.daily_order_counters (
  order_date  DATE PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Locked down — only the SECURITY DEFINER trigger below ever touches this
-- table. No policies means no client (anon or authenticated) can read or
-- write it directly.
ALTER TABLE public.daily_order_counters ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today DATE := (NOW() AT TIME ZONE 'Asia/Kolkata')::date;
  seq INTEGER;
BEGIN
  INSERT INTO public.daily_order_counters (order_date, last_number)
  VALUES (today, 1)
  ON CONFLICT (order_date)
  DO UPDATE SET last_number = public.daily_order_counters.last_number + 1
  RETURNING last_number INTO seq;

  NEW.order_number := 'BB-' || to_char(today, 'DD/MM/YY') || '-' || lpad(seq::text, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_number ON public.orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.generate_order_number();

-- Note: existing orders placed before this migration keep order_number = NULL.
-- The app falls back to showing their short UUID for those.

-- Verify
SELECT id, order_number, created_at FROM public.orders ORDER BY created_at DESC LIMIT 5;
