/** In-memory guest carts: session id -> { items: { id, qty }[] } (demo only; use Redis/DB in production). */
const store = new Map();

export function getServerCart(sid) {
  if (!store.has(sid)) store.set(sid, { items: [] });
  return store.get(sid);
}

export function setServerCart(sid, items) {
  store.set(sid, { items });
}
