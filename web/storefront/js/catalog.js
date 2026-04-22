/**
 * NexaSpark demo catalog — INR, MRP/% off/ratings.
 * When using `npm run dev`, keep this array in sync with `server/data/products.json`
 * (same ids and fields) until a build step or DB backs the API.
 */
export const PRODUCTS = [
  {
    id: 'p1',
    title: 'Noise-cancelling earbuds',
    category: 'electronics',
    price: 2499,
    mrp: 3999,
    rating: 4.3,
    reviews: 128,
    badge: 'Fast delivery',
    seller: 'TechVendor',
    desc: 'Bluetooth 5.3, 30h case battery.',
    image: 'images/products/p1.svg',
  },
  {
    id: 'p2',
    title: 'Stainless steel bottle 750ml',
    category: 'home',
    price: 599,
    mrp: 999,
    rating: 4.1,
    reviews: 56,
    badge: null,
    seller: 'HomeEssentials',
    desc: 'Double-wall insulated.',
    image: 'images/products/p2.svg',
  },
  {
    id: 'p3',
    title: 'Cotton crew neck tee',
    category: 'fashion',
    price: 449,
    mrp: 899,
    rating: 4.6,
    reviews: 890,
    badge: 'Trending',
    seller: 'StyleCo',
    desc: 'Regular fit, machine wash.',
    image: 'images/products/p3.svg',
  },
  {
    id: 'p4',
    title: 'USB-C hub 7-in-1',
    category: 'electronics',
    price: 1899,
    mrp: 2999,
    rating: 4.4,
    reviews: 203,
    badge: 'Fast delivery',
    seller: 'TechVendor',
    desc: 'HDMI 4K, SD, PD pass-through.',
    image: 'images/products/p4.svg',
  },
  {
    id: 'p5',
    title: 'Desk LED lamp',
    category: 'home',
    price: 899,
    mrp: 1499,
    rating: 3.9,
    reviews: 42,
    badge: null,
    seller: 'HomeEssentials',
    desc: 'Warm/cool white, touch dimmer.',
    image: 'images/products/p5.svg',
  },
  {
    id: 'p6',
    title: 'Running shoes',
    category: 'fashion',
    price: 2799,
    mrp: 4499,
    rating: 4.5,
    reviews: 412,
    badge: 'Bestseller',
    seller: 'StyleCo',
    desc: 'Breathable mesh, cushioned sole.',
    image: 'images/products/p6.svg',
  },
  {
    id: 'p7',
    title: '65" 4K Smart TV',
    category: 'electronics',
    price: 42999,
    mrp: 59999,
    rating: 4.2,
    reviews: 2100,
    badge: 'Fast delivery',
    seller: 'TechVendor',
    desc: 'HDR10, voice assistant ready.',
    image: 'images/products/p7.svg',
  },
  {
    id: 'p8',
    title: 'Fitness smartwatch',
    category: 'electronics',
    price: 3499,
    mrp: 5999,
    rating: 4.4,
    reviews: 156,
    badge: 'New',
    seller: 'TechVendor',
    desc: 'AMOLED, SpO₂, 7-day battery — demo listing.',
    image: 'images/products/p8.svg',
  },
  {
    id: 'p9',
    title: 'Ceramic pour-over coffee set',
    category: 'home',
    price: 1299,
    mrp: 2199,
    rating: 4.7,
    reviews: 89,
    badge: null,
    seller: 'HomeEssentials',
    desc: 'Dripper + server — demo listing.',
    image: 'images/products/p9.svg',
  },
  {
    id: 'p10',
    title: 'Urban roll-top backpack',
    category: 'fashion',
    price: 1899,
    mrp: 3299,
    rating: 4.3,
    reviews: 234,
    badge: 'Trending',
    seller: 'StyleCo',
    desc: 'Water-resistant shell, laptop sleeve — demo listing.',
    image: 'images/products/p10.svg',
  },
  {
    id: 'p11',
    title: 'Ergonomic wireless mouse',
    category: 'electronics',
    price: 1299,
    mrp: 1999,
    rating: 4.5,
    reviews: 512,
    badge: 'Fast delivery',
    seller: 'TechVendor',
    desc: 'Silent clicks, multi-device — demo listing.',
    image: 'images/products/p11.svg',
  },
  {
    id: 'p12',
    title: 'Non-slip yoga mat 6mm',
    category: 'home',
    price: 899,
    mrp: 1499,
    rating: 4.2,
    reviews: 167,
    badge: null,
    seller: 'HomeEssentials',
    desc: 'Eco TPE, carry strap — demo listing.',
    image: 'images/products/p12.svg',
  },
];

export function formatInr(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function discountPct(mrp, price) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function byId(id) {
  if (id == null || id === '') return undefined;
  const key = String(id).trim().toLowerCase();
  return PRODUCTS.find((p) => p.id === key);
}

/** Escape for use in HTML attribute values (e.g. img alt). */
export function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/** Escape text for safe insertion as HTML text content (titles, descriptions). */
export function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
