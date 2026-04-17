const asyncHandler = require("../middleware/asyncHandler");
const Product = require("../models/Product");
const Review = require("../models/Review");
const buildCatalogQuery = require("../utils/catalogQuery");
const getRecommendations = require("../services/recommendationService");

const getProducts = asyncHandler(async (req, res) => {
  const { filters, pagination, sort } = buildCatalogQuery(req.query);

  const [items, total] = await Promise.all([
    Product.find(filters).sort(sort).skip(pagination.skip).limit(pagination.limit),
    Product.countDocuments(filters),
  ]);

  res.json({
    success: true,
    items,
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: Math.ceil(total / pagination.limit),
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  const reviews = await Review.find({ product: product._id })
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .limit(10);

  const recommendations = await getRecommendations(product);

  res.json({ success: true, product, reviews, recommendations });
});

module.exports = { getProducts, getProductById };
