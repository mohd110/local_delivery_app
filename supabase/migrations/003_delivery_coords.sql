-- ============================================================
-- Restaurant Direct — Save customer GPS pin on each order
-- Needed for the live tracking map (restaurant pin, customer
-- pin, rider's live pin). Run this AFTER 002_rider_flow.sql.
-- Safe to re-run.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_latitude  DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(11,8);

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
  AND column_name IN ('delivery_latitude', 'delivery_longitude');
