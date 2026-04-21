# NexaSpark — mobile (secondary track)

The **web** storefront lives under `web/storefront/` and is the primary delivery surface.

This folder is reserved for a future native or hybrid app (React Native, Flutter, Kotlin, Swift, or PWA packaging). Until an app scaffold exists:

- Reuse product IDs, pricing display rules, and cart semantics from the web implementation.
- Add mobile-specific tests alongside code when you introduce a framework here.

Run web locally:

```bash
cd ../..
npm run serve:web
```
