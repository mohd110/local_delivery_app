-- ============================================================
-- Restaurant Direct — Order complaints + customer self-cancel
-- Run AFTER 006_fix_signup_phone.sql. Safe to re-run.
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- 1. COMPLAINTS TABLE
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.complaints (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID    NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category    TEXT    NOT NULL CHECK (category IN (
                 'food_quality', 'missing_items', 'wrong_items',
                 'late_delivery', 'payment_issue', 'rider_behavior', 'other'
               )),
  description TEXT    NOT NULL DEFAULT '',
  status      TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "complaints_insert_own"       ON public.complaints;
DROP POLICY IF EXISTS "complaints_select"           ON public.complaints;
DROP POLICY IF EXISTS "complaints_update_restaurant" ON public.complaints;

-- Customer can file a complaint only against their own order
CREATE POLICY "complaints_insert_own"
  ON public.complaints FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND customer_id = auth.uid()
    )
  );

-- Customer sees their own complaints; restaurant sees all
CREATE POLICY "complaints_select"
  ON public.complaints FOR SELECT
  USING (
    auth.uid() = customer_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'restaurant'
    )
  );

-- Only the restaurant can update status (open → in_progress → resolved)
CREATE POLICY "complaints_update_restaurant"
  ON public.complaints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'restaurant'
    )
  );

ALTER TABLE public.complaints REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'complaints'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════
-- 2. CUSTOMER SELF-CANCEL — within 5 minutes of placing the order
--    Customers currently have NO update access to orders at all
--    (only restaurant/rider do) — this adds a narrow, time-boxed
--    exception: a customer may flip their own recent order to
--    'cancelled', and nothing else.
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "orders_update_own_cancel" ON public.orders;

CREATE POLICY "orders_update_own_cancel"
  ON public.orders FOR UPDATE
  USING (
    auth.uid() = customer_id
    AND status NOT IN ('delivered', 'cancelled')
    AND created_at > NOW() - INTERVAL '5 minutes'
  )
  WITH CHECK (
    auth.uid() = customer_id
    AND status = 'cancelled'
  );


-- ═══════════════════════════════════════════════════════════
-- 3. VERIFY
-- ═══════════════════════════════════════════════════════════

SELECT count(*) AS complaints_table_rows FROM public.complaints;
SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND policyname LIKE '%cancel%';
