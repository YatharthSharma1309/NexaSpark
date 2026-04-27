# NexaSpark storefront (web)

```bash
# from repo root — full stack (API + static), recommended
npm run dev
# → http://127.0.0.1:3000/

# static only (no /api)
npm run serve:web
# → http://127.0.0.1:8080/
```

| Page | File |
|------|------|
| Home | `index.html` |
| Listing + filters | `products.html` |
| Product | `product.html?id=` |
| Cart | `cart.html` |
| Order confirmation | `order.html?id=` (after demo checkout with `npm run dev`) |

Cart/wishlist keys: `nexaspark_storefront_cart`, `nexaspark_storefront_wishlist` (migrates from old `shopsample_*` once).

See repo root `README.md` for manual smoke, `sync:catalog`, and demo non-goals.
