import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { validateSpecsShape } from './constants/taxonomy.js';
import Product from './models/Product.js';
import User from './models/User.js';
import Coupon from './models/Coupon.js';

const samples = [
  {
    sku: 'LAP-NX-1001',
    title: 'NexaSpark Book 14',
    description: 'Thin laptop for everyday work and light creative tasks.',
    price: 54999,
    condition: 'new',
    category: 'Electronics',
    subcategory: 'Laptops',
    modelName: 'NXB-14-1001',
    warrantyMonths: 12,
    specs: { cpu: '8-core', ramGb: 16, storageGb: 512, screenInches: 14, os: 'Windows' },
    stockQuantity: 25,
    images: [],
  },
  {
    sku: 'PHN-NX-2001',
    title: 'NexaSpark Phone Mini',
    description: 'Compact smartphone with all-day battery.',
    price: 18999,
    condition: 'new',
    category: 'Electronics',
    subcategory: 'Smartphones',
    modelName: 'NXP-Mini',
    warrantyMonths: 12,
    specs: { storageGb: 128, ramGb: 6, screenInches: 6.1, batteryMah: 4500, os: 'Android' },
    stockQuantity: 80,
    images: [],
  },
  {
    sku: 'AUD-NX-3001',
    title: 'NexaSpark Buds Pro',
    description: 'Wireless earbuds with hybrid noise cancellation.',
    price: 7999,
    condition: 'refurbished',
    category: 'Electronics',
    subcategory: 'Audio',
    modelName: 'NXB-Pro',
    warrantyMonths: 6,
    specs: { connectivity: 'Bluetooth 5.3', batteryHours: 28, noiseCancelling: true },
    stockQuantity: 40,
    images: [],
  },
  {
    sku: 'WEA-NX-4001',
    title: 'NexaSpark Band 3',
    description: 'Fitness band with sleep tracking and week-long battery.',
    price: 4999,
    condition: 'new',
    category: 'Electronics',
    subcategory: 'Wearables',
    modelName: 'NXB-3',
    warrantyMonths: 12,
    specs: { connectivity: 'Bluetooth LE', batteryDays: 7, waterResistance: '5 ATM' },
    stockQuantity: 60,
    images: [],
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is required to seed');
    process.exit(1);
  }
  await mongoose.connect(uri);

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await User.updateOne(
      { email: adminEmail },
      {
        $set: { passwordHash, role: 'admin', email: adminEmail },
        $setOnInsert: { name: 'Admin' },
      },
      { upsert: true }
    );
    console.log('Admin upserted', adminEmail);
  }

  for (const row of samples) {
    const check = validateSpecsShape(row.subcategory, row.specs);
    if (!check.ok) {
      console.warn('Seed spec validation:', row.sku, check);
    }
    await Product.updateOne({ sku: row.sku }, { $set: row }, { upsert: true });
    console.log('Upserted', row.sku);
  }

  await Coupon.updateOne(
    { code: 'SAVE10' },
    {
      $set: {
        code: 'SAVE10',
        label: 'Seed 10% off',
        discountType: 'percent',
        value: 10,
        active: true,
        minSubtotal: 0,
      },
    },
    { upsert: true }
  );
  console.log('Coupon upserted SAVE10');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
