const express = require("express");
const { body } = require("express-validator");
const { protect } = require("../middleware/auth");
const { createReview } = require("../controllers/reviewController");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post(
  "/:productId",
  protect,
  [
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("comment").optional().isLength({ max: 1000 }).withMessage("Comment is too long"),
  ],
  validateRequest,
  createReview
);

module.exports = router;
