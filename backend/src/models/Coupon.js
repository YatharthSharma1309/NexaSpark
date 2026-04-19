import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    label: { type: String, default: '' },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    currency: { type: String, default: () => process.env.DEFAULT_CURRENCY || 'INR', trim: true },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    maxRedemptions: { type: Number, default: null },
    redemptionCount: { type: Number, default: 0 },
    minSubtotal: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
