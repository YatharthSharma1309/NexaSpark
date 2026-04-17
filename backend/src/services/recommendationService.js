const Product = require("../models/Product");

const getRecommendations = async (product) => {
  if (!product) return [];

  const recommendations = await Product.find({
    _id: { $ne: product._id },
    $or: [{ category: product.category }, { isFeatured: true }],
  })
    .sort({ rating: -1, createdAt: -1 })
    .limit(4);

  return recommendations;
};

module.exports = getRecommendations;
