# Rider App Integration — Wali Baba Foods

This is the integration contract between the existing backend (Supabase) and the
Flutter rider app. The rider app connects to the **same Supabase project** already
used by the customer web app and the restaurant dashboard — there is one shared
database, three clients (customer web, restaurant dashboard, rider app).

You already have the Supabase project URL + anon key wired up in the Flutter app,
so connection setup isn't covered here — this doc covers the schema, the one
database migration to run, and the exact flow/queries the rider app needs.

**Update:** since this doc was first written, three more migrations were added
to the customer-facing app: `003_delivery_coords.sql` (saves the customer's exact
GPS pin per order), `004_addresses.sql` (multi-address book — not relevant to the
rider app), and `005_coupons.sql` (discount codes — not relevant to the rider app).
The schema reference below (section 2) already reflects all of this. The migration
in section 1 below is still the only one *you* need to run for the rider flow itself.


## 1. Database migration — run once in Supabase SQL Editor

Whoever has access to the Supabase project dashboard needs to run this **once**,
in **SQL Editor** (not from the Flutter app — this is a one-time schema change).
It is idempotent (safe to run twice).

```sql
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
```

Without this migration, the rider app will still mostly work, but: GPS pings will
pile up as duplicate rows instead of upserting, and two riders tapping "Accept" on
the same order at the same moment could both succeed (double-booking).


## 2. Schema reference (already exists — nothing to create)

```
profiles
  id          uuid, PK, = auth.users.id
  role        text  'customer' | 'restaurant' | 'rider'
  full_name   text
  email       text
  phone       text | null

  → A rider's own row has role = 'rider'. Created automatically on
    Supabase Auth sign-up via a DB trigger, with role read from the
    user's signup metadata: { "role": "rider", "full_name": "..." }

orders
  id                 uuid, PK
  restaurant_id      uuid, FK → restaurants.id
  customer_id        uuid, FK → profiles.id
  rider_id           uuid | null, FK → profiles.id   ← rider claims by setting this
  status             text  'pending' | 'accepted' | 'preparing' | 'ready' |
                            'out_for_delivery' | 'delivered' | 'cancelled'
  payment_status     text  'pending_verification' | 'verified' | 'failed'
  utr_number         text | null
  order_type         text  'delivery' | 'pickup'  (currently always 'delivery')
  delivery_address   jsonb  { name, phone, address, landmark?, pincode }
  delivery_latitude  decimal | null   ← customer's exact GPS pin, use this for navigation
  delivery_longitude decimal | null     instead of geocoding the text address — it's
                                         null if the customer typed their address manually
                                         instead of granting GPS, so always check for null
  delivery_fee       integer
  coupon_code        text | null      (not relevant to the rider app)
  discount_amount    integer          (not relevant to the rider app)
  total              integer
  created_at         timestamptz

addresses  (not used by the rider app — customer's saved address book, the
            chosen one gets snapshotted into orders.delivery_address/lat/lng
            at checkout time, so you never need to query this table directly)

coupons  (not used by the rider app)

order_items
  order_id        uuid, FK → orders.id
  product_id      uuid, FK → products.id
  quantity        integer
  price_at_order  integer

products  (read-only reference, joined for item names)
  id, name, description, price, photo_url, is_available

restaurants  (read-only — pickup location)
  id, name, address, phone, latitude, longitude, is_open

rider_locations  ← rider app writes here every 5 seconds
  rider_id    uuid, FK → profiles.id
  order_id    uuid, FK → orders.id   (UNIQUE after the migration above)
  latitude    decimal(10,8)
  longitude   decimal(11,8)
  updated_at  timestamptz
```


## 3. Test rider account

Create one in Supabase Dashboard → Authentication → Users → Add user:

```
email: rider@demo.com
password: demo1234
metadata: { "role": "rider", "full_name": "Test Rider" }
```

The `handle_new_user` trigger reads `role` from this metadata and creates the
matching `profiles` row automatically. Signing in returns a session whose
`auth.uid()` matches `profiles.id` — that's what RLS checks against.


## 4. The flow, step by step

### Step 0 — order lifecycle so far (already built, not the rider app's job)
1. Customer places order → `orders` row created, `status='pending'`,
   `payment_status='pending_verification'`, `rider_id=null`
2. Restaurant dashboard verifies the UPI payment and taps "Verify & Accept" →
   `payment_status='verified'`, `status='accepted'`
3. Restaurant taps "Start Preparing" → `status='preparing'`
4. Restaurant taps "Mark Ready" → `status='ready'`

From here on, the rider app takes over.

### Step 1 — "Available Orders" list
Show orders that are ready to be claimed — verified payment, no rider yet:

```dart
final available = await supabase
  .from('orders')
  .select('*, order_items(quantity, price_at_order, products(name)), restaurants(name, address, latitude, longitude)')
  .filter('rider_id', 'is', null)
  .eq('payment_status', 'verified')
  .inFilter('status', ['accepted', 'preparing', 'ready'])
  .order('created_at');
```

`select('*')` already includes `delivery_latitude`/`delivery_longitude` — use those
for the drop-off pin when present, fall back to showing the text `delivery_address`
fields (and let the rider navigate manually) when they're null.

Subscribe to Realtime so new orders appear live without polling:

```dart
supabase
  .channel('available-orders')
  .onPostgresChanges(
    event: PostgresChangeEvent.all,
    schema: 'public',
    table: 'orders',
    callback: (payload) {
      // refetch the available-orders list
    },
  )
  .subscribe();
```

### Step 2 — Rider taps "Accept" (atomic claim)
This is the critical part — guard against two riders claiming the same order:

```dart
final claimed = await supabase
  .from('orders')
  .update({'rider_id': myRiderId})
  .eq('id', orderId)
  .filter('rider_id', 'is', null)   // only succeeds if still unclaimed
  .select();

if (claimed.isEmpty) {
  // someone else claimed it first — show "Order already taken", refresh list
} else {
  // success — move to "My Active Delivery"
}
```

The RLS policy from the migration enforces this server-side too — even if the
client-side `.filter` were removed, Postgres will reject the update if
`rider_id` is already set to someone else.

### Step 3 — "My Active Delivery"
```dart
final myOrder = await supabase
  .from('orders')
  .select('*, order_items(quantity, price_at_order, products(name))')
  .eq('rider_id', myRiderId)
  .not('status', 'in', ['delivered', 'cancelled'])
  .maybeSingle();
```

Show: pickup address + coords (`restaurants.address`/`latitude`/`longitude` —
already in the joined data from step 1, or fetch separately), drop-off address
(`orders.delivery_address` text, plus `delivery_latitude`/`delivery_longitude`
when not null), customer phone (inside `delivery_address.phone` — note this can
be an empty string if the customer never set a phone on their profile, so handle
that gracefully rather than assuming it's always callable), and order items.

### Step 4 — Rider physically picks up food at the restaurant
```dart
await supabase.from('orders').update({'status': 'out_for_delivery'}).eq('id', orderId);
```

### Step 5 — Push GPS every 5 seconds while `out_for_delivery`
Upsert (not insert) — the unique constraint on `order_id` means this always
updates the same row instead of growing the table:

```dart
Timer.periodic(const Duration(seconds: 5), (_) async {
  final pos = await Geolocator.getCurrentPosition();
  await supabase.from('rider_locations').upsert({
    'order_id': orderId,
    'rider_id': myRiderId,
    'latitude': pos.latitude,
    'longitude': pos.longitude,
    'updated_at': DateTime.now().toIso8601String(),
  }, onConflict: 'order_id');
});
```
Cancel the timer when the order reaches `delivered` or `cancelled`.

The customer's order tracking page already has a live Google Map subscribed to
this exact table via Realtime — the moment you upsert here, a blue rider marker
appears/moves on their screen. No extra integration needed on your end; just push
accurate GPS and it shows up.

### Step 6 — Rider delivers
```dart
await supabase.from('orders').update({'status': 'delivered'}).eq('id', orderId);
```

The customer's order tracking page and the restaurant dashboard are both
subscribed to Realtime on `orders` and will update instantly when this happens.


## 5. RLS rules that affect the rider app

- A rider can `SELECT` any order (needed to browse "Available Orders").
- A rider can `UPDATE` an order only if `rider_id IS NULL` (claiming) or
  `rider_id = auth.uid()` (their own active delivery). They cannot touch an
  order already claimed by a different rider.
- A rider can `INSERT`/`UPDATE` `rider_locations` only where `rider_id = auth.uid()`
  — they cannot spoof another rider's GPS.
- A rider can `SELECT` from `restaurants` and `products` (public read).

If a query returns empty / a write silently fails, it's almost always one of
these RLS rules rejecting the request — check that the signed-in user's
`profiles.role = 'rider'` and that `rider_id` matches `auth.uid()` where required.
