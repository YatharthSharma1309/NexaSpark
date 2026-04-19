import { API_BASE } from './config';
import type { CartLine, Order, Product, Review, UserProfile, WishlistItem } from '../types/api';

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as { error?: { message?: string } }).error?.message === 'string'
        ? (data as { error: { message: string } }).error.message
        : null;
    throw new Error(msg || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function api<T>(
  path: string,
  options: RequestInit & { json?: unknown; token?: string | null } = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }
  const body =
    options.json !== undefined ? JSON.stringify(options.json) : (options.body as BodyInit | undefined);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body,
  });
  return parseJsonResponse<T>(res);
}

export async function loginRequest(email: string, password: string) {
  return api<{ user: UserProfile; token: string }>('/api/auth/login', {
    method: 'POST',
    json: { email, password },
  });
}

export async function signupRequest(email: string, password: string, name: string) {
  return api<{ user: UserProfile; token: string }>('/api/auth/signup', {
    method: 'POST',
    json: { email, password, name },
  });
}

export async function fetchProducts(token: string | null, params?: { q?: string; page?: number }) {
  const q = new URLSearchParams();
  if (params?.q?.trim()) q.set('q', params.q.trim());
  if (params?.page) q.set('page', String(params.page));
  const qs = q.toString();
  return api<{ products: Product[]; total: number; page: number; limit: number }>(
    `/api/products${qs ? `?${qs}` : ''}`
  );
}

export async function fetchProduct(productId: string) {
  return api<{ product: Product }>(`/api/products/${productId}`);
}

export async function getCart(token: string) {
  return api<{ cart: { items: { productId: string; quantity: number }[] } }>('/api/cart', { token });
}

export async function putCart(
  token: string,
  items: { productId: string; quantity: number }[]
) {
  return api<{ cart: { items: unknown[] } }>('/api/cart', {
    method: 'PUT',
    token,
    json: { items },
  });
}

export async function addToCart(token: string, productId: string, qty: number) {
  const data = await getCart(token);
  const map = new Map<string, number>();
  for (const row of data.cart.items) {
    map.set(row.productId, row.quantity);
  }
  map.set(productId, (map.get(productId) || 0) + qty);
  const items = [...map.entries()].map(([productId, quantity]) => ({ productId, quantity }));
  return putCart(token, items);
}

export async function fetchCartFull(token: string) {
  return api<{ cart: { items: CartLine[] } }>('/api/cart', { token });
}

export async function placeOrder(token: string, couponCode?: string) {
  return api<{ order: Order }>('/api/orders', {
    method: 'POST',
    token,
    json: couponCode ? { couponCode } : {},
  });
}

export type StripeCheckoutOptions = {
  /** Use `nexaspark://` return URLs (native + dev build); omit for web `CLIENT_ORIGIN` success page. */
  checkoutReturn?: 'app';
};

export async function createStripeCheckoutSession(
  token: string,
  couponCode?: string,
  options: StripeCheckoutOptions = {}
) {
  const json: Record<string, unknown> = {};
  if (couponCode) json.couponCode = couponCode;
  if (options.checkoutReturn === 'app') json.checkoutReturn = 'app';
  return api<{ url: string }>('/api/stripe/checkout-session', {
    method: 'POST',
    token,
    json,
  });
}

export async function fetchOrders(token: string) {
  return api<{ orders: Order[] }>('/api/orders', { token });
}

export async function getWishlist(token: string) {
  return api<{ wishlist: { items: WishlistItem[] } }>('/api/wishlist', { token });
}

export async function putWishlist(token: string, items: { productId: string }[]) {
  return api<{ wishlist: { items: WishlistItem[] } }>('/api/wishlist', {
    method: 'PUT',
    token,
    json: { items },
  });
}

export async function toggleWishlistProduct(token: string, productId: string) {
  const data = await getWishlist(token);
  const ids = data.wishlist.items.map((i) => i.productId);
  const set = new Set(ids);
  if (set.has(productId)) set.delete(productId);
  else set.add(productId);
  return putWishlist(
    token,
    [...set].map((id) => ({ productId: id }))
  );
}

export async function fetchProductReviews(productId: string) {
  return api<{ reviews: Review[] }>(`/api/products/${productId}/reviews`);
}

export async function postProductReview(
  token: string,
  productId: string,
  payload: { rating: number; title: string; body: string }
) {
  return api<{ review: Review }>(`/api/products/${productId}/reviews`, {
    method: 'POST',
    token,
    json: payload,
  });
}

export async function fetchProductRecommendations(productId: string) {
  return api<{ products: Product[] }>(`/api/products/${productId}/recommendations`);
}
