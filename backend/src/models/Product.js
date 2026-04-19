import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      default: () => process.env.DEFAULT_CURRENCY || 'INR',
      trim: true,
    },
    condition: {
      type: String,
      enum: ['new', 'refurbished', 'open_box'],
      required: true,
    },
    category: { type: String, default: 'Electronics', trim: true },
    subcategory: { type: String, trim: true },
    modelName: { type: String, trim: true },
    warrantyMonths: { type: Number, min: 0 },
    specs: { type: mongoose.Schema.Types.Mixed, default: {} },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }],
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text', sku: 'text' });

export default mongoose.models.Product || mongoose.model('Product', productSchema);
