/**
 * NexaSpark demo catalog — INR, MRP/% off/ratings.
 * When using `npm run dev`, keep this array in sync with `server/data/products.json`
 * (same ids and fields) until a build step or DB backs the API.
 *
 * Product photos: HTTPS URLs on Pexels CDN (no broken imgs if local files are missing).
 * IDs stay in sync with scripts/product-image-sources.mjs; local JPEGs via scripts/download-product-images.mjs.
 */
/** @type {Record<string, number>} */
const PEXELS_PHOTO_ID_BY_PRODUCT = {
  p1: 9890196,
  p2: 7879895,
  p3: 4066293,
  p4: 4195398,
  p5: 13068362,
  p6: 15592489,
  p7: 33805706,
  p8: 437037,
  p9: 3028996,
  p10: 2909441,
  p11: 14363329,
  p12: 6193815,
};

/** Pexels CDN — works on GitHub Pages, file://, and local dev without hosting /images. */
export function pexelsCatalogImageUrl(productId) {
  const key = String(productId || '')
    .trim()
    .toLowerCase();
  const n = PEXELS_PHOTO_ID_BY_PRODUCT[key];
  if (n == null) return '';
  return `https://images.pexels.com/photos/${n}/pexels-photo-${n}.jpeg?auto=compress&cs=tinysrgb&w=800`;
}

export const PRODUCTS = [
  {
    id: 'p1',
    title: 'NexaBuds Pro ANC Wireless Earbuds (Bluetooth 5.3, 30h with case)',
    category: 'electronics',
    price: 2499,
    mrp: 3999,
    rating: 4.3,
    reviews: 128,
    badge: 'Fast delivery',
    seller: 'TechVendor',
    desc: 'Hybrid ANC, IPX5, dual mics for calls. Demo listing — replace with your SKU.',
    image: pexelsCatalogImageUrl('p1'),
  },
  {
    id: 'p2',
    title: 'NexaSteel Insulated Water Bottle 750ml — Flip Lid, Double Wall',
    category: 'home',
    price: 599,
    mrp: 999,
    rating: 4.1,
    reviews: 56,
    badge: null,
    seller: 'HomeEssentials',
    desc: '18/8 stainless steel, keeps drinks hot or cold for hours.',
    image: pexelsCatalogImageUrl('p2'),
  },
  {
    id: 'p3',
    title: 'UrbanMark Men’s Premium Cotton Crew Neck T-Shirt (Regular Fit)',
    category: 'fashion',
    price: 449,
    mrp: 899,
    rating: 4.6,
    reviews: 890,
    badge: 'Trending',
    seller: 'StyleCo',
    desc: '180 GSM combed cotton, reinforced collar, machine wash.',
    image: pexelsCatalogImageUrl('p3'),
  },
  {
    id: 'p4',
    title: 'NexaLink USB-C 7-in-1 Hub — HDMI 4K60, USB 3.0, SD/TF, 100W PD',
    category: 'electronics',
    price: 1899,
    mrp: 2999,
    rating: 4.4,
    reviews: 203,
    badge: 'Fast delivery',
    seller: 'TechVendor',
    desc: 'Single-cable dock for laptops and tablets with USB-C Alt Mode.',
    image: pexelsCatalogImageUrl('p4'),
  },
  {
    id: 'p5',
    title: 'StudyPro LED Desk Lamp — Touch Dimming, Warm & Cool White',
    category: 'home',
    price: 899,
    mrp: 1499,
    rating: 3.9,
    reviews: 42,
    badge: null,
    seller: 'HomeEssentials',
    desc: 'Eye-care diffuser, memory brightness, USB power adapter included.',
    image: pexelsCatalogImageUrl('p5'),
  },
  {
    id: 'p6',
    title: 'StrideRun Men’s Running Shoes — Breathable Mesh, Cushioned Midsole',
    category: 'fashion',
    price: 2799,
    mrp: 4499,
    rating: 4.5,
    reviews: 412,
    badge: 'Bestseller',
    seller: 'StyleCo',
    desc: 'Lightweight trainer for daily runs and gym; rubber outsole.',
    image: pexelsCatalogImageUrl('p6'),
  },
  {
    id: 'p7',
    title: 'VisionMax 165 cm (65") 4K UHD Smart LED TV — HDR10, Dolby Audio',
    category: 'electronics',
    price: 42999,
    mrp: 59999,
    rating: 4.2,
    reviews: 2100,
    badge: 'Fast delivery',
    seller: 'TechVendor',
    desc: 'Android TV ready, 3× HDMI, voice remote — demo spec sheet.',
    image: pexelsCatalogImageUrl('p7'),
  },
  {
    id: 'p8',
    title: 'PulseFit AMOLED Fitness Smartwatch — SpO₂, HR, 7-Day Battery',
    category: 'electronics',
    price: 3499,
    mrp: 5999,
    rating: 4.4,
    reviews: 156,
    badge: 'New',
    seller: 'TechVendor',
    desc: '1.4" always-on display, 100+ workout modes, 5ATM swim rating (demo).',
    image: pexelsCatalogImageUrl('p8'),
  },
  {
    id: 'p9',
    title: 'BrewCraft Ceramic Pour-Over Coffee Set — Dripper & Server (2 Cup)',
    category: 'home',
    price: 1299,
    mrp: 2199,
    rating: 4.7,
    reviews: 89,
    badge: null,
    seller: 'HomeEssentials',
    desc: 'Food-safe glaze, fits standard V60 filters — starter kit for home brewing.',
    image: pexelsCatalogImageUrl('p9'),
  },
  {
    id: 'p10',
    title: 'Commute 20L Roll-Top Backpack — 15.6" Laptop Sleeve, Water-Resistant',
    category: 'fashion',
    price: 1899,
    mrp: 3299,
    rating: 4.3,
    reviews: 234,
    badge: 'Trending',
    seller: 'StyleCo',
    desc: 'Ripstop polyester, padded straps, front organizer pocket.',
    image: pexelsCatalogImageUrl('p10'),
  },
  {
    id: 'p11',
    title: 'ClickSilent Ergonomic Wireless Mouse — Dual Bluetooth + USB Receiver',
    category: 'electronics',
    price: 1299,
    mrp: 1999,
    rating: 4.5,
    reviews: 512,
    badge: 'Fast delivery',
    seller: 'TechVendor',
    desc: 'Silent switches, 1600–3200 DPI, multi-device pairing.',
    image: pexelsCatalogImageUrl('p11'),
  },
  {
    id: 'p12',
    title: 'FlexMat TPE Yoga & Exercise Mat 6mm — Non-Slip, Carry Strap',
    category: 'home',
    price: 899,
    mrp: 1499,
    rating: 4.2,
    reviews: 167,
    badge: null,
    seller: 'HomeEssentials',
    desc: 'Eco-friendly TPE, reversible texture, easy to wipe clean.',
    image: pexelsCatalogImageUrl('p12'),
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

/**
 * Normalizes catalog image fields for <img src>: HTTPS/data URLs pass through;
 * relative paths (e.g. self-hosted images/products/…) stay document-relative.
 */
export function productImageSrc(path) {
  if (path == null || path === '') return '';
  let s = String(path).trim().replace(/\\/g, '/');
  if (/^https?:\/\//i.test(s) || s.startsWith('data:')) return s;
  return s.replace(/^\/+/, '');
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
