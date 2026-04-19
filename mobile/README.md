# NexaSpark mobile (Expo)

Phase **M** app (in-repo scope **complete** per `NexaSpark.md` §5): same REST API as `backend/` and the web storefront. **Implemented:** login/signup (SecureStore), catalog search, **wishlist** screen + PDP toggle, product detail with **reviews** (read/post), **recommendations**, add to cart, **stub** checkout, **Stripe** (app return via `openAuthSessionAsync` + `nexaspark://`, or web `CLIENT_ORIGIN` path), orders. **Store IDs:** `ios.bundleIdentifier` / `android.package` default **`com.nexaspark.mobile`** — replace before your Play/App Store apps. **M-2** store submissions: see **`NexaSpark.md`** Phase M-2 checklist. **`eas.json`** defines default EAS build profiles (`development`, `preview`, `production`); run `npm run typecheck` before push (matches CI).

## Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/) via `npx expo` (no global install required)
- Android Studio / Xcode or the Expo Go app on a physical device

## Run

```bash
cd mobile
npm install
npx expo start
```

## API base URL

The web UI uses `http://127.0.0.1:4000` in `frontend/public/js/api.js`. On a device or emulator, **localhost** refers to the phone, not your PC.

1. Copy `.env.example` to `.env` (optional; Expo loads `EXPO_PUBLIC_*` at build time).
2. Set `EXPO_PUBLIC_API_BASE` to your machine’s LAN IP and port, e.g. `http://192.168.1.10:4000`.
3. Set `CLIENT_ORIGIN` / CORS on the backend to allow your Expo dev origin if needed.

Restart `expo start` after changing env files.

**Android emulator:** use `EXPO_PUBLIC_API_BASE=http://10.0.2.2:4000` so the guest reaches the host API on port 4000.

## Related docs

- Blueprint: [../NexaSpark.md](../NexaSpark.md) (Phase M checklist)
- Runbook: [../README.md](../README.md)
