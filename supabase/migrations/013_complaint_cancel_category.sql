-- Add 'cancel_order' to complaints category CHECK constraint
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_category_check;

ALTER TABLE public.complaints
  ADD CONSTRAINT complaints_category_check
  CHECK (category IN (
    'food_quality', 'missing_items', 'wrong_items',
    'late_delivery', 'payment_issue', 'rider_behavior',
    'cancel_order', 'other'
  ));
