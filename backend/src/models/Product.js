const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, index: true },
    brand: { type: String, index: true },
    price: { type: Number, required: true, min: 0, index: true },
    stock: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: "" },
    rating: { type: Number, default: 0, min: 0, max: 5, index: true },
    reviewCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", brand: "text" });

module.exports = mongoose.model("Product", productSchema);
