const asyncHandler = require("../middleware/asyncHandler");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");

const recalculateProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const reviewCount = reviews.length;
  const rating =
    reviewCount === 0
      ? 0
      : Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(2));
  await Product.updateOne({ _id: productId }, { rating, reviewCount });
};

const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;

  const hasPurchased = await Order.exists({
    user: req.user._id,
    paymentStatus: { $in: ["pending", "paid"] },
    "items.product": productId,
  });

  if (!hasPurchased) {
    const error = new Error("You can review only purchased products");
    error.statusCode = 403;
    throw error;
  }

  const review = await Review.findOneAndUpdate(
    { user: req.user._id, product: productId },
    { rating, comment },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await recalculateProductRating(productId);

  res.status(201).json({ success: true, review });
});

module.exports = { createReview };
