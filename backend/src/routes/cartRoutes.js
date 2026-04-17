const express = require("express");
const { body } = require("express-validator");
const { protect } = require("../middleware/auth");
const { getCart, addToCart, updateCartItem, removeCartItem } = require("../controllers/cartController");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.use(protect);

router.get("/", getCart);
router.post(
  "/items",
  [
    body("productId").notEmpty().withMessage("Product ID is required"),
    body("quantity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Quantity should be at least 1"),
  ],
  validateRequest,
  addToCart
);
router.patch(
  "/items/:productId",
  [body("quantity").isInt({ min: 1 }).withMessage("Quantity should be at least 1")],
  validateRequest,
  updateCartItem
);
router.delete("/items/:productId", removeCartItem);

module.exports = router;
