-- ============================================================
-- Restaurant Direct — Rider claim safety + location upsert
-- Run this AFTER 001_init.sql. Safe to re-run.
-- ============================================================


-- ═══════════════════════════════════════════════════════════
-- 1. ONE LOCATION ROW PER ORDER
--    Lets the Flutter rider app use upsert(onConflict: 'order_id')
--    every 5 seconds instead of inserting a new row each time.
-- ═══════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rider_locations_order_id_unique'
  ) THEN
    ALTER TABLE public.rider_locations
      ADD CONSTRAINT rider_locations_order_id_unique UNIQUE (order_id);
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════
-- 2. SPLIT orders UPDATE POLICY
--    Old policy let ANY rider update ANY order (no claim safety —
--    two riders could race to grab the same order, or one rider
--    could edit another rider's active delivery).
--    New: restaurant can update any order; a rider can only
--    claim an UNCLAIMED order or update an order already
--    assigned to them.
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "orders_update_restaurant" ON public.orders;
DROP POLICY IF EXISTS "orders_update_rider"      ON public.orders;

CREATE POLICY "orders_update_restaurant"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'restaurant'
    )
  );

CREATE POLICY "orders_update_rider"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'rider'
    )
    AND (rider_id IS NULL OR rider_id = auth.uid())
  );


-- ═══════════════════════════════════════════════════════════
-- 3. VERIFY
-- ═══════════════════════════════════════════════════════════

SELECT conname FROM pg_constraint WHERE conname = 'rider_locations_order_id_unique';
SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND policyname LIKE 'orders_update%';
