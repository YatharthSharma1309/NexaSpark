const asyncHandler = require("../middleware/asyncHandler");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await cart.populate("items.product");
  }
  return cart;
};

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json({ success: true, cart });
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (quantity > product.stock) {
    const error = new Error("Insufficient stock");
    error.statusCode = 400;
    throw error;
  }

  const cart = await getOrCreateCart(req.user._id);
  const itemIndex = cart.items.findIndex((item) => item.product._id.toString() === productId);

  if (itemIndex >= 0) {
    const nextQty = cart.items[itemIndex].quantity + quantity;
    if (nextQty > product.stock) {
      const error = new Error("Insufficient stock");
      error.statusCode = 400;
      throw error;
    }
    cart.items[itemIndex].quantity = nextQty;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();
  const populated = await cart.populate("items.product");
  res.status(201).json({ success: true, cart: populated });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((entry) => entry.product._id.toString() === req.params.productId);

  if (!item) {
    const error = new Error("Item not found in cart");
    error.statusCode = 404;
    throw error;
  }

  const product = await Product.findById(req.params.productId);
  if (!product || quantity > product.stock) {
    const error = new Error("Insufficient stock");
    error.statusCode = 400;
    throw error;
  }

  item.quantity = quantity;
  await cart.save();
  const populated = await cart.populate("items.product");
  res.json({ success: true, cart: populated });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((entry) => entry.product._id.toString() !== req.params.productId);
  await cart.save();
  const populated = await cart.populate("items.product");
  res.json({ success: true, cart: populated });
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };
