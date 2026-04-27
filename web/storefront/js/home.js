import { formatInr, discountPct, escAttr, escHtml, productImageSrc } from './catalog.js';
import { getProducts } from './catalogApi.js';
import { syncCartBadge } from './nav.js';

function starRow(rating) {
  const full = Math.round(rating);
  let s = '';
  for (let i = 0; i < full; i++) s += '★';
  return `<span class="stars" aria-label="${escAttr(String(rating))} out of 5">${s}</span>`;
}

function card(p) {
  const off = discountPct(p.mrp, p.price);
  const img = p.image
    ? `<div class="card__img"><img src="${escAttr(productImageSrc(p.image))}" alt="${escAttr(p.title)}" loading="lazy" decoding="async" width="600" height="480" /></div>`
    : '<div class="card__img" aria-hidden="true"></div>';
  const badge = p.badge ? `<span class="badge">${escHtml(p.badge)}</span>` : '';
  return `<article class="card">
    <a class="card__link" href="product.html?id=${encodeURIComponent(p.id)}">
      ${img}
      <h3 class="card__title">${escHtml(p.title)}</h3>
      <p class="card__rating">${starRow(p.rating)} <span class="muted">${p.rating} (${p.reviews})</span></p>
      <p class="card__price"><span class="price">${formatInr(p.price)}</span>
        ${off ? `<span class="strike">${formatInr(p.mrp)}</span> <span class="pct">${off}% off</span>` : ''}
      </p>
      ${badge}
    </a>
  </article>`;
}

function dealPillLabel(title) {
  if (title.length <= 22) return title;
  return `${title.slice(0, 22)}…`;
}

/** Home spotlight — same order as index hero tiles (.home-tile__img--1…8) and slide B/C art in style.css. */
const FEATURED_PRODUCT_IDS = ['p1', 'p8', 'p6', 'p3', 'p7', 'p4', 'p9', 'p10'];

function pickFeatured(products) {
  const byId = new Map(products.map((p) => [p.id, p]));
  return FEATURED_PRODUCT_IDS.map((id) => byId.get(id)).filter(Boolean);
}

/** Top discount % first, then review count as a tiebreaker. */
function topDeals(products, limit = 4) {
  return [...products]
    .map((p) => ({ p, off: discountPct(p.mrp, p.price) }))
    .sort((a, b) => b.off - a.off || b.p.reviews - a.p.reviews)
    .slice(0, limit)
    .map((x) => x.p);
}

const dealStrip = document.getElementById('deal-strip');
const featured = document.getElementById('featured-grid');

async function loadHome() {
  const products = await getProducts();
  if (dealStrip) {
    dealStrip.innerHTML = topDeals(products, 4)
      .map(
        (p) =>
          `<a class="deal-pill" href="product.html?id=${encodeURIComponent(p.id)}">${escHtml(dealPillLabel(p.title))} · ${formatInr(
            p.price
          )}</a>`
      )
      .join('');
  }

  if (featured) {
    const rows = pickFeatured(products);
    featured.innerHTML = rows.length ? rows.map(card).join('') : products.map(card).join('');
  }
}

loadHome().catch(() => {
  if (dealStrip) dealStrip.innerHTML = '<p class="muted" role="alert">Could not load deals.</p>';
  if (featured) featured.innerHTML = '<p class="muted" role="alert">Could not load products.</p>';
});

/* Hero carousel */
const track = document.getElementById('hero-track');
const slides = track ? [...track.querySelectorAll('.hero-slide')] : [];
const prevBtn = document.querySelector('.hero-carousel__prev');
const nextBtn = document.querySelector('.hero-carousel__next');
const live = document.getElementById('hero-slide-status');
let slideIdx = 0;

function slideAnnouncement() {
  if (!live || !slides[slideIdx]) return;
  const h = slides[slideIdx].querySelector('h1, h2');
  const title = h?.textContent?.trim() || 'Slide';
  const n = slideIdx + 1;
  live.textContent = `${title} — slide ${n} of ${slides.length}`;
}

function showSlide(i) {
  if (!slides.length) return;
  slideIdx = ((i % slides.length) + slides.length) % slides.length;
  slides.forEach((el, j) => {
    const on = j === slideIdx;
    el.hidden = !on;
    el.setAttribute('aria-hidden', on ? 'false' : 'true');
  });
  slideAnnouncement();
}

prevBtn?.addEventListener('click', () => showSlide(slideIdx - 1));
nextBtn?.addEventListener('click', () => showSlide(slideIdx + 1));

const heroCarousel = document.querySelector('.hero-carousel');
heroCarousel?.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  e.preventDefault();
  if (e.key === 'ArrowLeft') showSlide(slideIdx - 1);
  else showSlide(slideIdx + 1);
});

showSlide(0);

syncCartBadge();
