/**
 * Use LAN IP in `.env` for physical devices (see `mobile/README.md`).
 * Android emulator: `http://10.0.2.2:4000` reaches host port 4000.
 */
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://127.0.0.1:4000';
