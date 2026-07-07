-- Allow restaurant to notify customer of unavailable items before accepting.
-- Two new nullable columns on orders — no new tables, no status changes.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS unavailable_items UUID[]   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS modified_total   INTEGER   DEFAULT NULL;

-- Customer can accept a modification (restaurant marked items unavailable)
CREATE POLICY "customers_accept_modification" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = customer_id
    AND unavailable_items IS NOT NULL
  )
  WITH CHECK (
    status             = 'accepted'
    AND payment_status = 'verified'
    AND unavailable_items IS NULL
  );

-- Customer can cancel a modification request (no time restriction for this case)
CREATE POLICY "customers_cancel_modification" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = customer_id
    AND unavailable_items IS NOT NULL
  )
  WITH CHECK (
    status              = 'cancelled'
    AND cancellation_reason = 'customer_requested'
  );
