const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce",
  jwtSecret: process.env.JWT_SECRET || "development_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  clientUrl: process.env.CLIENT_URL || "http://127.0.0.1:5500",
  nodeEnv: process.env.NODE_ENV || "development",
};

module.exports = env;
