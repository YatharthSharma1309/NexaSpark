const express = require("express");
const { body } = require("express-validator");
const { signup, login, me, purchaseHistory } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validateRequest,
  signup
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  login
);

router.get("/me", protect, me);
router.get("/history", protect, purchaseHistory);

module.exports = router;
