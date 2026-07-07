-- Run this in Supabase SQL Editor to sync the full physical menu into the products table.
-- Uses ON CONFLICT so it's safe to run multiple times.

INSERT INTO public.products (id, name, description, price, photo_url, is_available)
VALUES

  -- ── BIRYANI & RICE ──────────────────────────────────────────
  ('9170d644-5efd-4147-a094-f0f9c50c55cc', 'Chicken Biryani',
   'Aromatic basmati rice slow-cooked with tender chicken, whole spices, caramelised onions and saffron.',
   160, '/chicken-biryani.png', TRUE),

  ('240ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Tikka Rice',
   'Flavourful basmati rice served with chunks of roasted chicken tikka and spiced gravy.',
   240, NULL, TRUE),

  ('c01ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Lollipop Rice',
   'Basmati rice served alongside crispy chicken lollipops with spiced gravy.',
   220, NULL, TRUE),

  ('c02ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Tangdi Rice',
   'Aromatic rice served with a whole marinated chicken tangdi, slow-cooked with spices.',
   250, NULL, TRUE),

  ('c03ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Barra Rice',
   'Fragrant basmati rice paired with juicy marinated chicken barra pieces.',
   270, NULL, TRUE),

  ('c04ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Leg Rice',
   'Basmati rice served with a whole spiced chicken leg, dum-cooked to perfection.',
   220, NULL, TRUE),

  ('250ed7aa-80c8-4e2e-913e-247b88a8d599', 'Mutton Biryani (2pcs)',
   'Rich basmati rice slow-cooked with 2 tender mutton pieces, saffron and aromatic spices.',
   250, '/mutton-korma.png', TRUE),

  ('c05ed7aa-80c8-4e2e-913e-247b88a8d599', 'Mutton Biryani (3pcs)',
   'Rich basmati rice slow-cooked with 3 tender mutton pieces, saffron and aromatic spices.',
   300, NULL, TRUE),

  ('130ed7aa-80c8-4e2e-913e-247b88a8d599', 'Biryani Rice',
   'Plain aromatic basmati rice cooked in biryani stock and saffron.',
   130, NULL, TRUE),

  -- ── FRY ─────────────────────────────────────────────────────
  ('b09ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Leg / Chest',
   'Crispy deep-fried chicken leg or chest piece marinated in red chili paste and spices.',
   140, NULL, TRUE),

  ('b10ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Lollipop (4pcs)',
   'Crispy fried chicken wings shaped like lollipops, coated in a spicy batter.',
   180, NULL, TRUE),

  ('b11ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Tikka Fry (5pcs)',
   'Spiced chicken chunks pan-fried with green chilies, onions and chaat masala.',
   220, NULL, TRUE),

  ('b12ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Kaleji',
   'Spicy chicken liver dry fry with ginger, garlic and fresh green herbs.',
   130, NULL, TRUE),

  -- ── GRAVY ────────────────────────────────────────────────────
  ('b01ed7aa-80c8-4e2e-913e-247b88a8d599', 'Butter Chicken',
   'Classic murgh makhani in rich, buttery tomato sauce — available bone-in or boneless.',
   250, '/butter-chicken.png', TRUE),

  ('b02ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Stew',
   'Comforting, lightly spiced chicken gravy cooked with onions and whole garam masala — bone-in or boneless.',
   250, NULL, TRUE),

  ('b03ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Korma',
   'Tender chicken slow-cooked in a rich yogurt and cashew-based curry — bone-in or boneless.',
   250, NULL, TRUE),

  ('c06ed7aa-80c8-4e2e-913e-247b88a8d599', 'Mutton Stew (2pcs)',
   'Lightly spiced mutton gravy with 2 pieces, cooked with whole spices and onions.',
   250, NULL, TRUE),

  ('c07ed7aa-80c8-4e2e-913e-247b88a8d599', 'Mutton Stew (4pcs)',
   'Lightly spiced mutton gravy with 4 pieces, cooked with whole spices and onions.',
   450, NULL, TRUE),

  ('c08ed7aa-80c8-4e2e-913e-247b88a8d599', 'Mutton Korma (2pcs)',
   'Slow-cooked mutton in a rich yogurt and cashew-based korma gravy — 2 pieces.',
   250, NULL, TRUE),

  ('c09ed7aa-80c8-4e2e-913e-247b88a8d599', 'Mutton Korma (4pcs)',
   'Slow-cooked mutton in a rich yogurt and cashew-based korma gravy — 4 pieces.',
   450, NULL, TRUE),

  ('b04ed7aa-80c8-4e2e-913e-247b88a8d599', 'Mutton Rogan Josh (2pcs)',
   'Kashmiri style slow-cooked mutton in rich red onion and tomato gravy — 2 pieces.',
   250, NULL, TRUE),

  ('c10ed7aa-80c8-4e2e-913e-247b88a8d599', 'Mutton Rogan Josh (4pcs)',
   'Kashmiri style slow-cooked mutton in rich red onion and tomato gravy — 4 pieces.',
   450, NULL, TRUE),

  -- ── KEBABS ───────────────────────────────────────────────────
  ('b14ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Shami Kebab',
   'Soft spiced chicken patties made with lentils, fried until golden.',
   180, NULL, TRUE),

  -- ── SHAAN & TANDOOR ──────────────────────────────────────────
  ('c11ed7aa-80c8-4e2e-913e-247b88a8d599', 'Murgh Malai Tikka',
   'Creamy boneless chicken marinated in malai, cashew paste and mild spices, grilled in clay oven.',
   250, NULL, TRUE),

  ('b17ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Tikka',
   'Classic spiced boneless chicken chunks grilled on skewers in clay oven.',
   250, NULL, TRUE),

  ('c12ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Afghani Barra (4pcs)',
   'Thick-cut chicken pieces marinated in Afghani spices, grilled over charcoal in the tandoor.',
   380, NULL, TRUE),

  ('c13ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Peshawari Tangdi (4pcs)',
   'Whole chicken drumsticks in rich Peshawari spice blend, slow-cooked in clay oven.',
   220, NULL, TRUE),

  ('b18ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Aatishi',
   'Fiery whole chicken marinated in red spices, cooked in a clay tandoor until perfectly charred.',
   300, '/chicken-aatishi.png', TRUE),

  ('b19ed7aa-80c8-4e2e-913e-247b88a8d599', 'Chicken Tandoori (Full)',
   'Full tandoori chicken marinated in yogurt and Indian spices, roasted on skewers.',
   500, NULL, TRUE),

  -- ── BREADS ───────────────────────────────────────────────────
  ('b05ed7aa-80c8-4e2e-913e-247b88a8d599', 'Rumali Roti',
   'Ultra-thin, soft flatbread cooked on an inverted iron griddle.',
   15, NULL, TRUE),

  ('c14ed7aa-80c8-4e2e-913e-247b88a8d599', 'Tandoori Roti',
   'Whole wheat flatbread baked in clay tandoor, soft and slightly charred.',
   20, NULL, TRUE),

  ('b06ed7aa-80c8-4e2e-913e-247b88a8d599', 'Butter Tandoori Roti',
   'Whole wheat flatbread baked in clay tandoor and brushed with fresh butter.',
   25, NULL, TRUE),

  ('b07ed7aa-80c8-4e2e-913e-247b88a8d599', 'Lachcha Paratha',
   'Layered whole wheat flatbread, crispy outside and soft inside.',
   30, NULL, TRUE),

  ('c15ed7aa-80c8-4e2e-913e-247b88a8d599', 'Plain Naan',
   'Soft leavened flatbread baked in clay tandoor.',
   35, NULL, TRUE),

  ('c16ed7aa-80c8-4e2e-913e-247b88a8d599', 'Butter Naan',
   'Soft leavened flatbread baked in clay tandoor and finished with a butter spread.',
   40, NULL, TRUE),

  ('b08ed7aa-80c8-4e2e-913e-247b88a8d599', 'Garlic Naan',
   'Fine flour leavened flatbread topped with minced garlic, baked in tandoor.',
   45, NULL, TRUE),

  ('c17ed7aa-80c8-4e2e-913e-247b88a8d599', 'Garlic Butter Naan',
   'Tandoor-baked naan loaded with minced garlic and butter for a rich, aromatic finish.',
   50, NULL, TRUE),

  -- ── DESSERTS & BEVERAGES ─────────────────────────────────────
  ('b20ed7aa-80c8-4e2e-913e-247b88a8d599', 'Lassi',
   'Thick churned yogurt drink, sweetened and topped with fresh malai.',
   50, NULL, TRUE),

  ('c18ed7aa-80c8-4e2e-913e-247b88a8d599', 'Butter Bun',
   'Soft, fluffy bun served warm with a generous spread of butter.',
   35, NULL, TRUE),

  ('b21ed7aa-80c8-4e2e-913e-247b88a8d599', 'Zafrani Kheer',
   'Rich slow-cooked rice pudding flavoured with saffron, cardamom and sliced almonds.',
   75, NULL, TRUE),

  ('b22ed7aa-80c8-4e2e-913e-247b88a8d599', 'Shahi Tukda',
   'Crispy fried bread slices soaked in saffron sugar syrup and topped with rabri.',
   80, NULL, TRUE)

ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  price       = EXCLUDED.price,
  photo_url   = COALESCE(EXCLUDED.photo_url, public.products.photo_url),
  is_available = EXCLUDED.is_available;

-- Hide items removed from the physical menu (kept so old order history still shows names)
UPDATE public.products SET is_available = FALSE WHERE id IN (
  'b13ed7aa-80c8-4e2e-913e-247b88a8d599', -- Special Galouti Kebab
  'b15ed7aa-80c8-4e2e-913e-247b88a8d599', -- Chicken Adana Kebab
  'b16ed7aa-80c8-4e2e-913e-247b88a8d599', -- Paneer Malai Tikka
  'b23ed7aa-80c8-4e2e-913e-247b88a8d599', -- Family Combo Meal
  'b24ed7aa-80c8-4e2e-913e-247b88a8d599'  -- Friends Combo Meal
);
