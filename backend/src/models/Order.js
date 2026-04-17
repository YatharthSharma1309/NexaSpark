const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true, default: 0 },
    shipping: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: "stripe" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paymentReference: { type: String, default: "" },
    orderStatus: {
      type: String,
      enum: ["created", "processing", "shipped", "delivered", "cancelled"],
      default: "created",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
