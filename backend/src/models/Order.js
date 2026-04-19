import mongoose from 'mongoose';

const orderLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    sku: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    specsSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    modelName: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lines: [orderLineSchema],
    subtotalAmount: { type: Number, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: '', trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'awaiting_payment',
        'pending',
        'paid',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ],
      default: 'pending',
    },
    stripeCheckoutSessionId: { type: String, sparse: true, unique: true },
    stripePaymentIntentId: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
