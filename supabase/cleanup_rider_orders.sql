-- ============================================================
-- One-off cleanup — NOT a migration, don't number/run this
-- automatically. Run manually in Supabase SQL Editor only.
--
-- Deletes test orders that reached the rider stage: anything
-- claimed by a rider (rider_id set) OR ready/out for delivery/
-- delivered. order_items, rider_locations, and complaints for
-- these orders are deleted automatically via ON DELETE CASCADE.
-- ============================================================

-- ── STEP 1: PREVIEW — run this first, check the row count and
--    rows look like what you expect before deleting anything ──

SELECT id, order_number, status, rider_id, created_at
FROM public.orders
WHERE rider_id IS NOT NULL
   OR status IN ('ready', 'out_for_delivery', 'delivered')
ORDER BY created_at DESC;


-- ── STEP 2: DELETE — only run this after checking Step 1 ──

DELETE FROM public.orders
WHERE rider_id IS NOT NULL
   OR status IN ('ready', 'out_for_delivery', 'delivered');


-- ── OPTIONAL: reset today's order-number counter ──
-- If you just deleted today's test orders and want the next
-- real order to start at 0001 again instead of continuing from
-- wherever it left off, also run this:

-- DELETE FROM public.daily_order_counters
-- WHERE order_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date;


-- ── ALTERNATIVE: wipe ALL orders, not just rider-stage ones ──
-- If you want a fully clean slate instead of the scoped delete
-- above, use this instead of Step 2:

-- DELETE FROM public.orders;
-- DELETE FROM public.daily_order_counters;
