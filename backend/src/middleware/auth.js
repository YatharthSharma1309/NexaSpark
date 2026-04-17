const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const User = require("../models/User");
const env = require("../config/env");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Not authorized");
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, env.jwtSecret);
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    const error = new Error("User no longer exists");
    error.statusCode = 401;
    throw error;
  }

  req.user = user;
  next();
});

module.exports = { protect };
