import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
  },
  { timestamps: { createdAt: 'receivedAt', updatedAt: false } }
);

export default mongoose.models.ProcessedStripeEvent ||
  mongoose.model('ProcessedStripeEvent', schema);
