-- ============================================================
-- Restaurant Direct — Complete Database Setup
-- Single source of truth. Safe to run on a fresh database
-- OR on top of a previous version (uses IF NOT EXISTS throughout)
-- ============================================================


-- ═══════════════════════════════════════════════════════════
-- 1. TABLES
-- ═══════════════════════════════════════════════════════════

-- User profiles (one row per Supabase auth user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'restaurant', 'rider')),
  full_name  TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items
CREATE TABLE IF NOT EXISTS public.products (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT    NOT NULL,
  description  TEXT    NOT NULL DEFAULT '',
  price        INTEGER NOT NULL CHECK (price > 0),
  photo_url    TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant business settings (one row for Wali Baba Foods)
CREATE TABLE IF NOT EXISTS public.restaurants (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT    NOT NULL,
  slug             TEXT    UNIQUE,
  cuisine_type     TEXT    DEFAULT 'Mughlai',
  logo_url         TEXT,
  address          TEXT,
  phone            TEXT,
  upi_id           TEXT,
  upi_qr_url       TEXT,
  delivery_fee     INTEGER NOT NULL DEFAULT 66,
  min_order_value  INTEGER NOT NULL DEFAULT 100,
  is_open          BOOLEAN NOT NULL DEFAULT TRUE,
  opening_time     TIME    DEFAULT '10:00',
  closing_time     TIME    DEFAULT '23:00',
  latitude         DECIMAL(10,8),
  longitude        DECIMAL(11,8),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Customer orders
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID    REFERENCES public.profiles(id) ON DELETE SET NULL,
  restaurant_id    UUID    REFERENCES public.restaurants(id) ON DELETE SET NULL,
  rider_id         UUID    REFERENCES public.profiles(id),
  status           TEXT    NOT NULL DEFAULT 'pending'
                     CHECK (status IN (
                       'pending', 'accepted', 'preparing', 'ready',
                       'out_for_delivery', 'delivered', 'cancelled'
                     )),
  payment_status   TEXT    NOT NULL DEFAULT 'pending_verification'
                     CHECK (payment_status IN ('pending_verification', 'verified', 'failed')),
  utr_number       TEXT,
  order_type       TEXT    NOT NULL DEFAULT 'delivery'
                     CHECK (order_type IN ('delivery', 'pickup')),
  delivery_address JSONB   NOT NULL DEFAULT '{}',
  delivery_fee     INTEGER NOT NULL DEFAULT 0,
  total            INTEGER NOT NULL CHECK (total >= 0),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Line items per order
CREATE TABLE IF NOT EXISTS public.order_items (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID    NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id     UUID    REFERENCES public.products(id) ON DELETE SET NULL,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  price_at_order INTEGER NOT NULL CHECK (price_at_order >= 0),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Live rider GPS positions (Flutter app writes here every 5 seconds)
CREATE TABLE IF NOT EXISTS public.rider_locations (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id   UUID    REFERENCES public.profiles(id),
  order_id   UUID    REFERENCES public.orders(id) ON DELETE CASCADE,
  latitude   DECIMAL(10,8) NOT NULL,
  longitude  DECIMAL(11,8) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════
-- 2. FIX CONSTRAINTS ON EXISTING orders TABLE
--    (safe no-op if orders was just created above)
-- ═══════════════════════════════════════════════════════════

-- Drop the old 4-value status check (auto-named by Postgres)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'orders'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'
      AND con.conname LIKE '%status%'
  ) LOOP
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- Re-add with all 7 statuses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'orders' AND con.conname = 'orders_status_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_status_check
      CHECK (status IN (
        'pending', 'accepted', 'preparing', 'ready',
        'out_for_delivery', 'delivered', 'cancelled'
      ));
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════
-- 3. ADD NEW COLUMNS TO orders (safe if columns already exist)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS restaurant_id    UUID    REFERENCES public.restaurants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rider_id         UUID    REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS payment_status   TEXT    NOT NULL DEFAULT 'pending_verification',
  ADD COLUMN IF NOT EXISTS utr_number       TEXT,
  ADD COLUMN IF NOT EXISTS order_type       TEXT    NOT NULL DEFAULT 'delivery',
  ADD COLUMN IF NOT EXISTS delivery_fee     INTEGER NOT NULL DEFAULT 0;


-- ═══════════════════════════════════════════════════════════
-- 4. AUTO-CREATE PROFILE ON SIGN-UP (trigger)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    -- Only allow 'restaurant' or 'rider' roles if the account is created
    -- via Supabase Dashboard (not via the public signup page).
    -- The signup page always sends role:'customer'.
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ═══════════════════════════════════════════════════════════
-- 5. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"  ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── products ──────────────────────────────────────────────
DROP POLICY IF EXISTS "products_select_all" ON public.products;

CREATE POLICY "products_select_all"
  ON public.products FOR SELECT
  USING (true);

-- ── restaurants ───────────────────────────────────────────
DROP POLICY IF EXISTS "restaurants_select_all"        ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_update_restaurant" ON public.restaurants;

-- Anyone can read restaurant info (needed for public menu page + checkout)
CREATE POLICY "restaurants_select_all"
  ON public.restaurants FOR SELECT
  USING (true);

-- Only restaurant role can update settings
CREATE POLICY "restaurants_update_restaurant"
  ON public.restaurants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'restaurant'
    )
  );

-- ── orders ────────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_insert_own"          ON public.orders;
DROP POLICY IF EXISTS "orders_select"              ON public.orders;
DROP POLICY IF EXISTS "orders_update_restaurant"   ON public.orders;

-- Customer inserts their own order
CREATE POLICY "orders_insert_own"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Customer sees own orders; restaurant and rider see all
CREATE POLICY "orders_select"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = customer_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('restaurant', 'rider')
    )
  );

-- Restaurant updates status; rider updates status when delivering
CREATE POLICY "orders_update_restaurant"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('restaurant', 'rider')
    )
  );

-- ── order_items ───────────────────────────────────────────
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;

CREATE POLICY "order_items_insert"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND customer_id = auth.uid()
    )
  );

CREATE POLICY "order_items_select"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND (
        customer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('restaurant', 'rider')
        )
      )
    )
  );

-- ── rider_locations ───────────────────────────────────────
DROP POLICY IF EXISTS "rider_locations_select" ON public.rider_locations;
DROP POLICY IF EXISTS "rider_locations_insert" ON public.rider_locations;
DROP POLICY IF EXISTS "rider_locations_update" ON public.rider_locations;

-- Customer sees location for their own order; restaurant and rider see all
CREATE POLICY "rider_locations_select"
  ON public.rider_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND customer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('restaurant', 'rider')
    )
  );

-- Only the assigned rider can push GPS updates
CREATE POLICY "rider_locations_insert"
  ON public.rider_locations FOR INSERT
  WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "rider_locations_update"
  ON public.rider_locations FOR UPDATE
  USING (auth.uid() = rider_id);


-- ═══════════════════════════════════════════════════════════
-- 6. REALTIME
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.orders          REPLICA IDENTITY FULL;
ALTER TABLE public.rider_locations REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'rider_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_locations;
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════
-- 7. SEED — MENU ITEMS (all 24 items with stable UUIDs)
--    ON CONFLICT updates name/description/price in case
--    you re-run this after changing a price.
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.products (id, name, description, price, is_available) VALUES

-- ── BIRYANI ──────────────────────────────────────────────
('9170d644-5efd-4147-a094-f0f9c50c55cc',
 'Chicken Biryani',
 'Aromatic basmati rice slow-cooked with tender chicken, whole spices, caramelised onions and saffron.',
 160, TRUE),

('240ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Chicken Tikka Rice',
 'Flavorful basmati rice served with chunks of roasted chicken tikka and spiced gravies.',
 240, TRUE),

('250ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Mutton Biryani',
 'Rich basmati rice slow-cooked with tender mutton pieces, saffron, and aromatic spices.',
 250, TRUE),

('130ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Biryani Rice',
 'Plain aromatic basmati rice cooked in biryani stock and saffron.',
 130, TRUE),

-- ── GRAVY ────────────────────────────────────────────────
('b01ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Butter Chicken',
 'Classic murgh makhani in rich, buttery tomato sauce with aromatic spices and fresh cream.',
 250, TRUE),

('b02ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Chicken Stew',
 'Comforting, lightly spiced chicken gravy cooked with onions and whole garam masala.',
 250, TRUE),

('b03ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Chicken Korma',
 'Tender chicken slow-cooked in a rich yogurt and cashew-based curry with cardamom flavor.',
 250, TRUE),

('b04ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Mutton Rogan Josh',
 'Kashmiri style slow-cooked mutton in a rich red onion and tomato gravy flavored with fennel.',
 250, TRUE),

-- ── BREADS ───────────────────────────────────────────────
('b05ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Rumali Roti',
 'Ultra-thin, soft flatbread cooked on an inverted iron griddle.',
 15, TRUE),

('b06ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Tandoori Roti (Butter)',
 'Whole wheat flatbread baked in clay tandoor and brushed with fresh butter.',
 25, TRUE),

('b07ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Lachha Paratha',
 'Layered whole wheat flatbread crispy outside and soft inside.',
 30, TRUE),

('b08ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Garlic Naan (Butter)',
 'Fine flour leavened flatbread topped with minced garlic and butter, baked in tandoor.',
 45, TRUE),

-- ── FRY ──────────────────────────────────────────────────
('b09ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Chicken Leg / Chest Fry',
 'Crispy deep-fried chicken leg or chest piece marinated in red chili paste and spices.',
 140, TRUE),

('b10ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Chicken Lollipop (4pcs)',
 'Crispy fried chicken wings shaped like lollipops, coated in a spicy batter.',
 180, TRUE),

('b11ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Chicken Tikka Fry (6pcs)',
 'Spiced chicken chunks pan-fried with green chilies, onions, and chat masala.',
 220, TRUE),

('b12ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Chicken Kaleji Fry',
 'Spicy chicken liver dry fry with ginger, garlic, and fresh green herbs.',
 130, TRUE),

-- ── KEBABS ───────────────────────────────────────────────
('b13ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Special Galouti Kebab',
 'Melt-in-mouth minced mutton patties cooked with over 150 aromatic spices.',
 299, TRUE),

('b14ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Chicken Shami Kebab',
 'Soft spiced chicken patties made with lentils, fried until golden.',
 180, TRUE),

('b15ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Chicken Adana Kebab',
 'Long hand-minced chicken skewers seasoned with red bell peppers and spices, grilled.',
 250, TRUE),

-- ── TANDOOR ──────────────────────────────────────────────
('b16ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Paneer Malai Tikka',
 'Creamy cubes of cottage cheese marinated in malai, grilled to perfection in the tandoor.',
 349, TRUE),

('b17ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Chicken Tikka',
 'Classic spiced boneless chicken chunks grilled on skewers in clay oven.',
 250, TRUE),

('b18ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Chicken Aatishi',
 'Fiery whole chicken marinated in red spices, cooked in a clay tandoor until perfectly charred.',
 300, TRUE),

('b19ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Chicken Tandoori (Full)',
 'Full tandoori chicken marinated in yogurt and Indian spices, roasted on skewers.',
 500, TRUE),

-- ── DESSERTS & BEVERAGES ─────────────────────────────────
('b20ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Special Sweet Lassi',
 'Thick churned yogurt drink sweetened and garnished with malai and dry fruits.',
 50, TRUE),

('b21ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Zafrani Kheer',
 'Rich slow-cooked rice pudding flavored with saffron, cardamom, and sliced almonds.',
 70, TRUE),

('b22ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Shahi Tukda',
 'Crispy fried bread slices soaked in saffron sugar syrup and topped with rabri.',
 80, TRUE),

-- ── COMBOS ───────────────────────────────────────────────
('b23ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Family Combo Meal',
 'Includes 1 Mutton Korma, 1 Butter Chicken, 2 Butter Tandoori/Rumali Roti, 2 Chicken Biryani, and 1 Salad Raita.',
 1111, TRUE),

('b24ed7aa-80c8-4e2e-913e-247b88a8d599',
 'Friends Combo Meal',
 'Includes 2 Chicken Biryani, 4 Tandoori/Rumali Roti, 1 Butter Chicken, and 2 Soft Drinks.',
 599, TRUE)

ON CONFLICT (id) DO UPDATE SET
  name         = EXCLUDED.name,
  description  = EXCLUDED.description,
  price        = EXCLUDED.price,
  is_available = EXCLUDED.is_available;


-- ═══════════════════════════════════════════════════════════
-- 8. SEED — WALI BABA FOODS RESTAURANT ROW
--    Fill in your real values before running, or update
--    the row afterwards in Table Editor.
-- ═══════════════════════════════════════════════════════════

INSERT INTO public.restaurants (
  name,
  slug,
  cuisine_type,
  address,
  phone,
  upi_id,
  upi_qr_url,
  delivery_fee,
  min_order_value,
  is_open,
  opening_time,
  closing_time,
  latitude,
  longitude
) VALUES (
  'Wali Baba Foods',
  'wali-baba-foods',
  'Mughlai',
  'YOUR RESTAURANT ADDRESS HERE',     -- e.g. '12 Tagore Road, Kanpur 208001'
  '+91XXXXXXXXXX',                    -- your WhatsApp / call number
  'walibaba@upi',                     -- real UPI ID
  NULL,                               -- paste URL after uploading QR to Supabase Storage
  66,                                 -- delivery fee in ₹
  100,                                -- minimum order value in ₹
  TRUE,
  '10:00',
  '23:00',
  NULL,                               -- latitude  e.g. 26.4499
  NULL                                -- longitude e.g. 80.3319
)
ON CONFLICT (slug) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- 9. VERIFY (results shown in Supabase output panel)
-- ═══════════════════════════════════════════════════════════

SELECT
  'profiles'        AS tbl, count(*) AS rows FROM public.profiles       UNION ALL
SELECT 'products',          count(*)         FROM public.products        UNION ALL
SELECT 'restaurants',       count(*)         FROM public.restaurants     UNION ALL
SELECT 'orders',            count(*)         FROM public.orders          UNION ALL
SELECT 'order_items',       count(*)         FROM public.order_items     UNION ALL
SELECT 'rider_locations',   count(*)         FROM public.rider_locations;

-- ============================================================
-- AFTER RUNNING:
-- 1. Go to Table Editor → restaurants → fill in your real
--    address, phone, UPI ID, and GPS coordinates
-- 2. Upload UPI QR image to Storage → paste URL into upi_qr_url
-- 3. Test accounts (Dashboard → Authentication → Users → Add user):
--    customer@demo.com  / demo1234  metadata: {"role":"customer","full_name":"Demo Customer"}
--    restaurant@demo.com / demo1234 metadata: {"role":"restaurant","full_name":"Demo Restaurant"}
-- ============================================================
