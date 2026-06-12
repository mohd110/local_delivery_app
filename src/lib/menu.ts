export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  photo: string
  bestseller?: boolean
}

export const MENU: MenuItem[] = [
  // ── BIRYANI ──
  {
    id: '9170d644-5efd-4147-a094-f0f9c50c55cc',
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice slow-cooked with tender chicken, whole spices, caramelised onions and saffron.',
    price: 160,
    category: 'Biryani',
    photo: '/chicken-biryani.png',
    bestseller: true,
  },
  {
    id: '240ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Chicken Tikka Rice',
    description: 'Flavorful basmati rice served with chunks of roasted chicken tikka and spiced gravies.',
    price: 240,
    category: 'Biryani',
    photo: '',
  },
  {
    id: '250ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Mutton Biryani',
    description: 'Rich basmati rice slow-cooked with tender mutton pieces, saffron, and aromatic spices.',
    price: 250,
    category: 'Biryani',
    photo: '/mutton-korma.png',
  },
  {
    id: '130ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Biryani Rice',
    description: 'Plain aromatic basmati rice cooked in biryani stock and saffron.',
    price: 130,
    category: 'Biryani',
    photo: '',
  },

  // ── GRAVY ──
  {
    id: 'b01ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Butter Chicken',
    description: 'Classic murgh makhani in rich, buttery tomato sauce with aromatic spices and fresh cream.',
    price: 250,
    category: 'Gravy',
    photo: '/butter-chicken.png',
    bestseller: true,
  },
  {
    id: 'b02ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Chicken Stew',
    description: 'Comforting, lightly spiced chicken gravy cooked with onions and whole garam masala.',
    price: 250,
    category: 'Gravy',
    photo: '',
  },
  {
    id: 'b03ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Chicken Korma',
    description: 'Tender chicken slow-cooked in a rich yogurt and cashew-based curry with cardamom flavor.',
    price: 250,
    category: 'Gravy',
    photo: '',
  },
  {
    id: 'b04ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Mutton Rogan Josh',
    description: 'Kashmiri style slow-cooked mutton in a rich red onion and tomato gravy flavored with fennel.',
    price: 250,
    category: 'Gravy',
    photo: '',
  },

  // ── BREADS ──
  {
    id: 'b05ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Rumali Roti',
    description: 'Ultra-thin, soft flatbread cooked on an inverted iron griddle.',
    price: 15,
    category: 'Breads',
    photo: '',
  },
  {
    id: 'b06ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Tandoori Roti (Butter)',
    description: 'Whole wheat flatbread baked in clay tandoor and brushed with fresh butter.',
    price: 25,
    category: 'Breads',
    photo: '',
  },
  {
    id: 'b07ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Lachha Paratha',
    description: 'Layered whole wheat flatbread crispy outside and soft inside.',
    price: 30,
    category: 'Breads',
    photo: '',
  },
  {
    id: 'b08ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Garlic Naan (Butter)',
    description: 'Fine flour leavened flatbread topped with minced garlic and butter, baked in tandoor.',
    price: 45,
    category: 'Breads',
    photo: '',
  },

  // ── FRY ──
  {
    id: 'b09ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Chicken Leg / Chest Fry',
    description: 'Crispy deep-fried chicken leg or chest piece marinated in red chili paste and spices.',
    price: 140,
    category: 'Fry',
    photo: '',
  },
  {
    id: 'b10ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Chicken Lollipop (4pcs)',
    description: 'Crispy fried chicken wings shaped like lollipops, coated in a spicy batter.',
    price: 180,
    category: 'Fry',
    photo: '',
  },
  {
    id: 'b11ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Chicken Tikka Fry (6pcs)',
    description: 'Spiced chicken chunks pan-fried with green chilies, onions, and chat masala.',
    price: 220,
    category: 'Fry',
    photo: '',
  },
  {
    id: 'b12ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Chicken Kaleji Fry',
    description: 'Spicy chicken liver dry fry with ginger, garlic, and fresh green herbs.',
    price: 130,
    category: 'Fry',
    photo: '',
  },

  // ── KEBABS ──
  {
    id: 'b13ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Special Galouti Kebab',
    description: 'Melt-in-mouth minced mutton patties cooked with over 150 aromatic spices.',
    price: 299,
    category: 'Kebabs',
    photo: '/galouti-kebab.png',
  },
  {
    id: 'b14ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Chicken Shami Kebab',
    description: 'Soft spiced chicken patties made with lentils, fried until golden.',
    price: 180,
    category: 'Kebabs',
    photo: '',
  },
  {
    id: 'b15ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Chicken Adana Kebab',
    description: 'Long hand-minced chicken skewers seasoned with red bell peppers and spices, grilled.',
    price: 250,
    category: 'Kebabs',
    photo: '',
    bestseller: true,
  },

  // ── TANDOOR ──
  {
    id: 'b16ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Paneer Malai Tikka',
    description: 'Creamy cubes of cottage cheese marinated in malai, grilled to perfection in the tandoor.',
    price: 349,
    category: 'Tandoor',
    photo: '/paneer-tikka.png',
  },
  {
    id: 'b17ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Chicken Tikka',
    description: 'Classic spiced boneless chicken chunks grilled on skewers in clay oven.',
    price: 250,
    category: 'Tandoor',
    photo: '',
  },
  {
    id: 'b18ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Chicken Aatishi',
    description: 'Fiery whole chicken marinated in red spices, cooked in a clay tandoor until perfectly charred.',
    price: 300,
    category: 'Tandoor',
    photo: '/chicken-aatishi.png',
  },
  {
    id: 'b19ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Chicken Tandoori (Full)',
    description: 'Full tandoori chicken marinated in yogurt and Indian spices, roasted on skewers.',
    price: 500,
    category: 'Tandoor',
    photo: '',
  },

  // ── DESSERTS & BEVERAGES ──
  {
    id: 'b20ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Special Sweet Lassi',
    description: 'Thick churned yogurt drink sweetened and garnished with malai and dry fruits.',
    price: 50,
    category: 'Desserts',
    photo: '',
  },
  {
    id: 'b21ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Zafrani Kheer',
    description: 'Rich slow-cooked rice pudding flavored with saffron, cardamom, and sliced almonds.',
    price: 70,
    category: 'Desserts',
    photo: '',
  },
  {
    id: 'b22ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Shahi Tukda',
    description: 'Crispy fried bread slices soaked in saffron sugar syrup and topped with rabri.',
    price: 80,
    category: 'Desserts',
    photo: '',
  },

  // ── COMBOS ──
  {
    id: 'b23ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Family Combo Meal',
    description: 'Includes 1 Mutton Korma, 1 Butter Chicken, 2 Butter Tandoori/Rumali Roti, 2 Chicken Biryani, and 1 Salad Raita.',
    price: 1111,
    category: 'Combos',
    photo: '',
    bestseller: true,
  },
  {
    id: 'b24ed7aa-80c8-4e2e-913e-247b88a8d599',
    name: 'Friends Combo Meal',
    description: 'Includes 2 Chicken Biryani, 4 Tandoori/Rumali Roti, 1 Butter Chicken, and 2 Soft Drinks.',
    price: 599,
    category: 'Combos',
    photo: '',
  },
]

export const TOPPINGS_MAP: Record<string, { name: string; price: number }[]> = {
  'Biryani': [
    { name: 'Extra Raita', price: 20 },
    { name: 'Extra Salan / Gravy', price: 30 },
    { name: 'Double Masala', price: 40 },
  ],
  'Kebabs': [
    { name: 'Extra Mint Chutney', price: 15 },
    { name: 'Rumali Roti (1 pc)', price: 20 },
    { name: 'Special Garlic Dip', price: 25 },
  ],
  'Tandoor': [
    { name: 'Extra Mint Chutney', price: 15 },
    { name: 'Rumali Roti (1 pc)', price: 20 },
    { name: 'Special Garlic Dip', price: 25 },
  ],
  'Gravy': [
    { name: 'Extra Butter', price: 30 },
    { name: 'Garlic Naan (1 pc)', price: 40 },
    { name: 'Lachha Paratha (1 pc)', price: 45 },
  ],
}
