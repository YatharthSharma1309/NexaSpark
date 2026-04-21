import { PRODUCTS, formatInr, discountPct, escAttr } from './catalog.js';
import { syncCartBadge } from './nav.js';

const grid = document.getElementById('plp-grid');
const sortEl = document.getElementById('sort');
const catEl = document.getElementById('filter-cat');
const minRatingEl = document.getElementById('filter-rating');
const qEl = document.getElementById('filter-q');
const headerCatEl = document.getElementById('plp-search-cat');

const params = new URLSearchParams(window.location.search);
const initialQ = (params.get('q') || '').trim().toLowerCase();
const initialCat = params.get('cat') || '';

if (qEl && initialQ) qEl.value = params.get('q') || '';
if (catEl && initialCat) catEl.value = initialCat;
if (headerCatEl && initialCat) headerCatEl.value = initialCat;

function starRow(rating) {
  const full = Math.round(rating);
  let s = '';
  for (let i = 0; i < full; i++) s += '★';
  return `<span class="stars">${s}</span> <span class="muted">${rating}</span>`;
}

function card(p) {
  const off = discountPct(p.mrp, p.price);
  const img = p.image
    ? `<div class="card__img"><img src="${p.image}" alt="${escAttr(p.title)}" loading="lazy" decoding="async" width="600" height="480" /></div>`
    : '<div class="card__img" aria-hidden="true"></div>';
  return `<article class="card">
    <a class="card__link" href="product.html?id=${encodeURIComponent(p.id)}">
      ${img}
      <h3 class="card__title">${p.title}</h3>
      <p class="card__rating">${starRow(p.rating)} · ${p.reviews} reviews</p>
      <p class="card__price"><span class="price">${formatInr(p.price)}</span>
        ${off ? `<span class="strike">${formatInr(p.mrp)}</span> <span class="pct">${off}% off</span>` : ''}
      </p>
    </a>
  </article>`;
}

function filterList() {
  const q = (qEl?.value || '').trim().toLowerCase();
  const cat = catEl?.value || '';
  const minR = Number(minRatingEl?.value) || 0;
  let list = PRODUCTS.filter((p) => {
    if (cat && p.category !== cat) return false;
    if (p.rating < minR) return false;
    if (q) {
      const hay = `${p.title} ${p.desc} ${p.category} ${p.seller}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const sort = sortEl?.value || 'pop';
  if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
  else if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
  return list;
}

function render() {
  if (!grid) return;
  const list = filterList();
  const q = (qEl?.value || '').trim();
  grid.innerHTML = list.length
    ? list.map(card).join('')
    : `<p class="muted" role="status">No products match${q ? ` for “${escAttr(q)}”` : ''}. <a href="products.html">Clear search</a> or try another keyword.</p>`;
}

['input', 'change'].forEach((ev) => {
  qEl?.addEventListener(ev, render);
  sortEl?.addEventListener(ev, render);
  catEl?.addEventListener(ev, () => {
    if (headerCatEl) headerCatEl.value = catEl.value;
    render();
  });
  minRatingEl?.addEventListener(ev, render);
  headerCatEl?.addEventListener(ev, () => {
    if (catEl) catEl.value = headerCatEl.value;
    render();
  });
});

render();
syncCartBadge();
