# Restaurant Dashboard Handoff — Wali Baba Foods

This covers the restaurant-facing dashboard, which lives in the **same Next.js
repo** as the customer app (not a separate project, unlike the rider app). It
shares one Supabase database with the customer web app and the Flutter rider app.

```
restaurant-direct/
  src/app/restaurant/
    login/page.tsx              ← restaurant sign-in
    dashboard/page.tsx          ← server component, fetches orders, role-guards
  src/components/
    DashboardClient.tsx         ← all the interactive order-management UI
    OrderStatusBadge.tsx        ← small status pill component
    NavBar.tsx                  ← shared header (role='restaurant' branch)
```


## 1. How to log in

`/restaurant/login` — separate login page from the customer one (`/login`).
Create an account via Supabase Dashboard → Authentication → Users → Add user,
with metadata `{ "role": "restaurant", "full_name": "..." }`. The `handle_new_user`
trigger reads `role` from that metadata to create the matching `profiles` row.

**Known gotcha:** if you log in and land on `/menu` (the customer menu) instead
of `/restaurant/dashboard`, your account's `profiles.role` is not actually
`'restaurant'` — check it in Table Editor. `dashboard/page.tsx` redirects anyone
who isn't `role='restaurant'` straight to `/menu`, which is correct behavior, but
confusing if you expected your test account to already have that role.


## 2. Full schema reference

```
profiles
  id, role ('customer'|'restaurant'|'rider'), full_name, email, phone

products
  id, name, description, price, photo_url, is_available

restaurants  (one row — Wali Baba Foods' own settings)
  id, name, slug, cuisine_type, logo_url, address, phone,
  upi_id, upi_qr_url, delivery_fee, min_order_value, is_open,
  opening_time, closing_time, latitude, longitude

orders
  id, customer_id, restaurant_id, rider_id,
  status            'pending'|'accepted'|'preparing'|'ready'|
                     'out_for_delivery'|'delivered'|'cancelled'
  payment_status    'pending_verification'|'verified'|'failed'
  utr_number        text | null   — customer's UPI transaction ID, shown so you
                                     can manually check it landed in your account
  order_type        'delivery'|'pickup'  (currently always 'delivery')
  delivery_address  jsonb { name, phone, address, landmark?, pincode }
  delivery_latitude / delivery_longitude   — customer's GPS pin, null if they
                                              typed their address manually
  delivery_fee, coupon_code, discount_amount, total

order_items
  order_id, product_id, quantity, price_at_order

addresses        — customer's saved address book (not directly relevant to the
                    dashboard; the chosen address is already snapshotted into
                    orders.delivery_address at checkout time)

coupons
  code, discount_amount, min_order_value, is_active
  → currently no admin UI for this — creating/disabling coupons means going
    into Table Editor directly. One demo coupon (FLAT50) is seeded.

rider_locations
  rider_id, order_id (unique), latitude, longitude, updated_at
  → written by the Flutter rider app every 5s. The dashboard doesn't currently
    show rider position on a map, only the rider's name/phone once assigned.
```


## 3. Order lifecycle — who moves it forward

```
pending             → customer placed the order, payment unverified
  ↓ [restaurant taps "Verify Payment & Accept"]
accepted            → payment_status set to 'verified' in the SAME update
  ↓ [restaurant taps "Start Preparing"]
preparing
  ↓ [restaurant taps "Mark Ready"]
ready               → order becomes visible in the rider app's "Available
                       Orders" pool (rider_id IS NULL AND payment_status='verified')
  ↓ [a rider claims it — sets rider_id, dashboard now shows their name/phone]
  ↓ [rider taps "picked up" in their own app]
out_for_delivery
  ↓ [rider taps "delivered" in their own app]
delivered

(any state before pickup can go to `cancelled` via the dashboard's Cancel button)
```

The restaurant only ever controls `pending → accepted → preparing → ready`.
Everything from `ready` onward is the rider app's job — there is currently
**no manual rider-assignment override** in the dashboard; riders self-claim only.


## 4. What's already built (`DashboardClient.tsx`)

- Realtime feed — new orders toast in and appear instantly via Supabase Realtime
  on `orders` (INSERT + UPDATE), no polling/refresh needed
- Each order card shows: items, customer name/phone, delivery address, and (while
  `payment_status='pending_verification'`) the UTR number for manual verification
- **"Verify Payment & Accept"** button — the literal gate that lets an order
  proceed; sets `payment_status='verified'` and `status='accepted'` together
- "Start Preparing" → `preparing`, "Mark Ready" → `ready`
- Once a rider claims the order, their name + phone appear on the card automatically
- **Cancel Order** button, available while `pending`/`accepted`/`preparing`

**A bug already fixed that's worth knowing about:** `orders` has two foreign
keys into `profiles` (`customer_id` and `rider_id`). A naive `profiles(...)`
join is ambiguous and Supabase/PostgREST rejects it once any order has a
`rider_id` set. The fix already in place uses explicit FK hints:
```ts
customer:profiles!orders_customer_id_fkey(full_name, phone),
rider:profiles!orders_rider_id_fkey(full_name, phone)
```
If you add more joins through `profiles` anywhere in dashboard code, you'll need
the same `!fkey_name` syntax or you'll hit the same error.


## 5. RLS rules that affect the dashboard

- `role='restaurant'` can `SELECT` and `UPDATE` **any** order (no ownership
  restriction — there's only one restaurant in this system).
- `role='restaurant'` can `UPDATE` the `restaurants` row (settings), but there's
  no UI for this yet — done via Table Editor.
- Anyone (including anonymous) can `SELECT` from `restaurants` and `products` —
  needed for the public menu page.


## 6. What's NOT built — likely next steps for you

- **Menu management UI** — adding/editing/disabling `products` rows currently
  requires Supabase Table Editor directly. No admin form exists.
- **Restaurant settings UI** — `delivery_fee`, `upi_id`, `latitude`/`longitude`,
  opening hours, `is_open` toggle — all Table Editor only, no dashboard page.
- **Coupon management UI** — same story, `coupons` table is Table-Editor-only.
- **Analytics / sales reporting** — nothing built (daily revenue, popular items,
  order volume, etc.).
- **Rider assignment override** — if no rider claims a `ready` order, there's
  currently no manual "assign rider X" button on the dashboard.
- **Order filtering/search** — `DashboardClient` renders every order in one flat
  list ordered by `created_at`. No active-vs-history split yet; as order volume
  grows this will get long. Worth adding tabs (Active / Completed / Cancelled).


## 7. Running it locally

Same repo, same `npm run dev` as the customer app — `restaurant-direct/`.
Dashboard route: `http://localhost:3000/restaurant/dashboard` (redirects to
`/restaurant/login` if not authenticated, or to `/menu` if authenticated but
not `role='restaurant'`).
