const API_BASE = "http://127.0.0.1:5000/api";
const state = {
  token: localStorage.getItem("token") || "",
  user: JSON.parse(localStorage.getItem("user") || "null"),
  page: 1,
  totalPages: 1,
  filters: {},
};

const ui = {
  feedback: document.getElementById("feedback"),
  userStatus: document.getElementById("userStatus"),
  logoutBtn: document.getElementById("logoutBtn"),
  productsGrid: document.getElementById("productsGrid"),
  pageInfo: document.getElementById("pageInfo"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  cartItems: document.getElementById("cartItems"),
  orderItems: document.getElementById("orderItems"),
};

const notify = (message, isError = false) => {
  ui.feedback.textContent = message;
  ui.feedback.style.color = isError ? "#b91c1c" : "#1d4ed8";
};

const authHeaders = () => (state.token ? { Authorization: `Bearer ${state.token}` } : {});

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "Request failed");
  return payload;
};

const updateAuthUi = () => {
  if (state.user) {
    ui.userStatus.textContent = `${state.user.name} (${state.user.email})`;
    ui.logoutBtn.hidden = false;
  } else {
    ui.userStatus.textContent = "Guest";
    ui.logoutBtn.hidden = true;
  }
};

const renderProducts = (products) => {
  ui.productsGrid.innerHTML = "";
  if (!products.length) {
    ui.productsGrid.innerHTML = "<p>No products found.</p>";
    return;
  }
  for (const product of products) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3>${product.name}</h3>
      <p>${product.category || "General"} · ${product.brand || "N/A"}</p>
      <p class="price">$${product.price.toFixed(2)}</p>
      <p>Stock: ${product.stock} · Rating: ${product.rating || 0}</p>
      <button data-add="${product._id}">Add to cart</button>
      <button class="ghost-btn" data-detail="${product._id}">View details</button>
    `;
    ui.productsGrid.appendChild(card);
  }
};

const fetchProducts = async () => {
  const params = new URLSearchParams({
    ...state.filters,
    page: String(state.page),
    limit: "8",
  });
  const payload = await request(`${API_BASE}/products?${params.toString()}`);
  renderProducts(payload.items);
  state.totalPages = payload.totalPages || 1;
  ui.pageInfo.textContent = `Page ${payload.page} of ${state.totalPages}`;
};

const applyFilters = () => {
  state.page = 1;
  state.filters = {
    search: document.getElementById("searchInput").value.trim(),
    category: document.getElementById("categoryInput").value,
    minPrice: document.getElementById("minPriceInput").value,
    maxPrice: document.getElementById("maxPriceInput").value,
    sortBy: document.getElementById("sortInput").value,
  };
  Object.keys(state.filters).forEach((key) => {
    if (!state.filters[key]) delete state.filters[key];
  });
  fetchProducts().catch((error) => notify(error.message, true));
};

const addToCart = async (productId) => {
  if (!state.token) {
    notify("Please log in before adding products to cart.", true);
    return;
  }
  await request(`${API_BASE}/cart/items`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  notify("Item added to cart.");
  loadCart();
};

const showProductDetails = async (productId) => {
  const payload = await request(`${API_BASE}/products/${productId}`);
  const product = payload.product;
  const firstReview = payload.reviews[0];
  notify(
    firstReview
      ? `${product.name}: ${product.description} | Latest review: ${firstReview.comment || "No comment"}`
      : `${product.name}: ${product.description}`
  );
};

const loadCart = async () => {
  if (!state.token) return;
  const payload = await request(`${API_BASE}/cart`, { headers: authHeaders() });
  ui.cartItems.innerHTML = "";
  for (const item of payload.cart.items) {
    const li = document.createElement("li");
    li.innerHTML = `
      ${item.product.name} x ${item.quantity} - $${(item.quantity * item.product.price).toFixed(2)}
      <button class="ghost-btn" data-remove="${item.product._id}">Remove</button>
    `;
    ui.cartItems.appendChild(li);
  }
};

const removeFromCart = async (productId) => {
  await request(`${API_BASE}/cart/items/${productId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  notify("Item removed from cart.");
  loadCart();
};

const checkout = async () => {
  if (!state.token) {
    notify("Log in to checkout.", true);
    return;
  }
  const payload = await request(`${API_BASE}/orders/checkout`, {
    method: "POST",
    headers: authHeaders(),
  });
  notify(`Order created (${payload.order._id}). Payment ref: ${payload.order.paymentReference}`);
  loadCart();
  loadOrders();
};

const loadOrders = async () => {
  if (!state.token) return;
  const payload = await request(`${API_BASE}/orders`, { headers: authHeaders() });
  ui.orderItems.innerHTML = "";
  for (const order of payload.orders) {
    const li = document.createElement("li");
    li.textContent = `${order._id.slice(-8)} · ${order.orderStatus} · ${order.paymentStatus} · $${order.total.toFixed(2)}`;
    ui.orderItems.appendChild(li);
  }
};

const signup = async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = await request(`${API_BASE}/auth/signup`, {
    method: "POST",
    body: JSON.stringify(Object.fromEntries(formData.entries())),
  });
  state.token = payload.token;
  state.user = payload.user;
  localStorage.setItem("token", state.token);
  localStorage.setItem("user", JSON.stringify(state.user));
  updateAuthUi();
  notify("Account created.");
};

const login = async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const payload = await request(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify(Object.fromEntries(formData.entries())),
  });
  state.token = payload.token;
  state.user = payload.user;
  localStorage.setItem("token", state.token);
  localStorage.setItem("user", JSON.stringify(state.user));
  updateAuthUi();
  notify("Logged in.");
  loadCart();
  loadOrders();
};

const logout = () => {
  state.token = "";
  state.user = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  updateAuthUi();
  ui.cartItems.innerHTML = "";
  ui.orderItems.innerHTML = "";
  notify("Logged out.");
};

document.getElementById("applyFiltersBtn").addEventListener("click", applyFilters);
document.getElementById("refreshBtn").addEventListener("click", () => fetchProducts().catch((e) => notify(e.message, true)));
document.getElementById("signupForm").addEventListener("submit", (event) => signup(event).catch((e) => notify(e.message, true)));
document.getElementById("loginForm").addEventListener("submit", (event) => login(event).catch((e) => notify(e.message, true)));
document.getElementById("loadCartBtn").addEventListener("click", () => loadCart().catch((e) => notify(e.message, true)));
document.getElementById("loadOrdersBtn").addEventListener("click", () => loadOrders().catch((e) => notify(e.message, true)));
document.getElementById("checkoutBtn").addEventListener("click", () => checkout().catch((e) => notify(e.message, true)));
ui.logoutBtn.addEventListener("click", logout);

ui.prevBtn.addEventListener("click", () => {
  if (state.page > 1) {
    state.page -= 1;
    fetchProducts().catch((e) => notify(e.message, true));
  }
});
ui.nextBtn.addEventListener("click", () => {
  if (state.page < state.totalPages) {
    state.page += 1;
    fetchProducts().catch((e) => notify(e.message, true));
  }
});

ui.productsGrid.addEventListener("click", (event) => {
  const addId = event.target.getAttribute("data-add");
  const detailId = event.target.getAttribute("data-detail");
  const removeId = event.target.getAttribute("data-remove");

  if (addId) addToCart(addId).catch((e) => notify(e.message, true));
  if (detailId) showProductDetails(detailId).catch((e) => notify(e.message, true));
  if (removeId) removeFromCart(removeId).catch((e) => notify(e.message, true));
});

ui.cartItems.addEventListener("click", (event) => {
  const removeId = event.target.getAttribute("data-remove");
  if (removeId) removeFromCart(removeId).catch((e) => notify(e.message, true));
});

updateAuthUi();
fetchProducts().catch((error) => notify(error.message, true));
