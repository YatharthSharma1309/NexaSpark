import { PRODUCTS, formatInr, discountPct, escAttr } from './catalog.js';
import { syncCartBadge } from './nav.js';

function starRow(rating) {
  const full = Math.round(rating);
  let s = '';
  for (let i = 0; i < full; i++) s += '★';
  return `<span class="stars" aria-label="${rating} out of 5">${s}</span>`;
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
      <p class="card__rating">${starRow(p.rating)} <span class="muted">${p.rating} (${p.reviews})</span></p>
      <p class="card__price"><span class="price">${formatInr(p.price)}</span>
        ${off ? `<span class="strike">${formatInr(p.mrp)}</span> <span class="pct">${off}% off</span>` : ''}
      </p>
      ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
    </a>
  </article>`;
}

const dealStrip = document.getElementById('deal-strip');
const featured = document.getElementById('featured-grid');

if (dealStrip) {
  dealStrip.innerHTML = PRODUCTS.slice(0, 4)
    .map(
      (p) =>
        `<a class="deal-pill" href="product.html?id=${p.id}">${p.title.slice(0, 22)}… · ${formatInr(p.price)}</a>`
    )
    .join('');
}

if (featured) {
  featured.innerHTML = PRODUCTS.map(card).join('');
}

/* Hero carousel */
const track = document.getElementById('hero-track');
const slides = track ? [...track.querySelectorAll('.hero-slide')] : [];
const prevBtn = document.querySelector('.hero-carousel__prev');
const nextBtn = document.querySelector('.hero-carousel__next');
let slideIdx = 0;

function showSlide(i) {
  if (!slides.length) return;
  slideIdx = ((i % slides.length) + slides.length) % slides.length;
  slides.forEach((el, j) => {
    const on = j === slideIdx;
    el.hidden = !on;
    el.setAttribute('aria-hidden', on ? 'false' : 'true');
  });
}

prevBtn?.addEventListener('click', () => showSlide(slideIdx - 1));
nextBtn?.addEventListener('click', () => showSlide(slideIdx + 1));
showSlide(0);

syncCartBadge();
