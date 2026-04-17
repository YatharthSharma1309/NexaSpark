const asyncHandler = require("../middleware/asyncHandler");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const createPaymentIntent = require("../services/paymentService");

const calculateOrderTotals = (cartItems) => {
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = Number((subtotal * 0.08).toFixed(2));
  const shipping = subtotal > 100 ? 0 : 10;
  const total = Number((subtotal + tax + shipping).toFixed(2));

  return { subtotal, tax, shipping, total };
};

const checkout = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    const error = new Error("Cart is empty");
    error.statusCode = 400;
    throw error;
  }

  for (const item of cart.items) {
    if (item.quantity > item.product.stock) {
      const error = new Error(`Insufficient stock for ${item.product.name}`);
      error.statusCode = 400;
      throw error;
    }
  }

  const totals = calculateOrderTotals(cart.items);
  const paymentIntent = await createPaymentIntent(totals.total, "usd");
  const orderItems = cart.items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
  }));

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    ...totals,
    paymentMethod: "stripe",
    paymentReference: paymentIntent.id,
    paymentStatus: "pending",
    orderStatus: "created",
  });

  for (const item of cart.items) {
    await Product.updateOne({ _id: item.product._id }, { $inc: { stock: -item.quantity } });
  }

  cart.items = [];
  await cart.save();

  res.status(201).json({
    success: true,
    order,
    payment: {
      provider: "stripe",
      clientSecret: paymentIntent.client_secret || "mock_client_secret",
      amount: paymentIntent.amount || Math.round(totals.total * 100),
    },
  });
});

const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }
  res.json({ success: true, order });
});

const mockPaymentWebhook = asyncHandler(async (req, res) => {
  const { orderId, paymentStatus } = req.body;
  const allowedStatuses = ["pending", "paid", "failed"];

  if (!orderId || !allowedStatuses.includes(paymentStatus)) {
    const error = new Error("orderId and valid paymentStatus are required");
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(orderId);
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  order.paymentStatus = paymentStatus;
  if (paymentStatus === "paid") order.orderStatus = "processing";
  if (paymentStatus === "failed") order.orderStatus = "cancelled";
  await order.save();

  res.json({ success: true, order });
});

module.exports = { checkout, listMyOrders, getOrderById, mockPaymentWebhook };
