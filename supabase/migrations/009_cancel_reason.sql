-- ============================================================
-- Restaurant Direct — Order Cancellation Reason
-- Run AFTER 008_order_numbers.sql. Safe to re-run.
-- ============================================================

-- Add cancel_reason column to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT
  CHECK (cancel_reason IN (
    'item_not_available',
    'too_busy',
    'customer_unreachable',
    'payment_issue',
    'customer_requested',
    'other'
  ));

-- ═══════════════════════════════════════════════════════════
-- Update the customer self-cancel policy to also allow
-- setting cancel_reason = 'customer_requested'
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
-- VERIFY
-- ═══════════════════════════════════════════════════════════

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'cancel_reason';
