const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const Order = require("../models/Order");
const generateToken = require("../utils/token");

const ensureValidRequest = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.statusCode = 400;
    throw error;
  }
};

const signup = asyncHandler(async (req, res) => {
  ensureValidRequest(req);
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("Email already in use");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

const login = asyncHandler(async (req, res) => {
  ensureValidRequest(req);
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  res.json({
    success: true,
    token: generateToken(user._id),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

const purchaseHistory = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

module.exports = { signup, login, me, purchaseHistory };
