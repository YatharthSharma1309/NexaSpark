const express = require("express");
const { protect } = require("../middleware/auth");
const { body } = require("express-validator");
const { checkout, listMyOrders, getOrderById, mockPaymentWebhook } = require("../controllers/orderController");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.use(protect);

router.post("/checkout", checkout);
router.post(
  "/payment-status",
  [body("orderId").notEmpty().withMessage("Order ID is required"), body("paymentStatus").notEmpty().withMessage("Payment status is required")],
  validateRequest,
  mockPaymentWebhook
);
router.get("/", listMyOrders);
router.get("/:id", getOrderById);

module.exports = router;
