import assert from 'node:assert';
import { after, before, beforeEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('API integration', () => {
  /** @type {import('express').Express} */
  let app;
  /** @type {MongoMemoryServer} */
  let mongoServer;

  before(async () => {
    process.env.NODE_ENV = 'test';
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'integration-test-jwt-secret-32chars!!';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.CLIENT_ORIGIN = 'http://127.0.0.1:8080';
    await mongoose.connect(process.env.MONGODB_URI);
    const mod = await import('../src/app.js');
    app = mod.default;
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    const cols = mongoose.connection.collections;
    await Promise.all(Object.values(cols).map((c) => c.deleteMany({})));
  });

  it('signup and login return a token', async () => {
    const signup = await request(app).post('/api/auth/signup').send({
      email: 'user@example.com',
      password: 'password123',
      name: 'User',
    });
    assert.strictEqual(signup.status, 201);
    assert.ok(signup.body.token);

    const login = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'password123',
    });
    assert.strictEqual(login.status, 200);
    assert.ok(login.body.token);
  });

  it('places order from cart and decrements stock', async () => {
    const signup = await request(app).post('/api/auth/signup').send({
      email: 'buyer@example.com',
      password: 'password123',
    });
    const token = signup.body.token;

    const Product = (await import('../src/models/Product.js')).default;
    const p = await Product.create({
      sku: 'T-SKU-1',
      title: 'Test Product',
      price: 100,
      condition: 'new',
      subcategory: 'Laptops',
      stockQuantity: 5,
      specs: { ramGb: 8 },
    });

    const putCart = await request(app)
      .put('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: p._id.toString(), quantity: 2 }] });
    assert.strictEqual(putCart.status, 200);

    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`);
    assert.strictEqual(orderRes.status, 201);
    assert.strictEqual(orderRes.body.order.status, 'paid');
    assert.strictEqual(orderRes.body.order.lines[0].quantity, 2);
    assert.strictEqual(orderRes.body.order.lines[0].specsSnapshot.ramGb, 8);

    const refreshed = await Product.findById(p._id);
    assert.strictEqual(refreshed.stockQuantity, 3);

    const emptyCart = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(emptyCart.body.cart.items.length, 0);
  });

  it('lists products and compares by ids', async () => {
    const Product = (await import('../src/models/Product.js')).default;
    const a = await Product.create({
      sku: 'A1',
      title: 'Alpha',
      price: 10,
      condition: 'new',
      subcategory: 'Audio',
      stockQuantity: 1,
      specs: { connectivity: 'BT' },
    });
    const b = await Product.create({
      sku: 'B1',
      title: 'Beta',
      price: 20,
      condition: 'new',
      subcategory: 'Audio',
      stockQuantity: 1,
      specs: { connectivity: 'BT' },
    });

    const list = await request(app).get('/api/products').query({ subcategory: 'Audio' });
    assert.strictEqual(list.status, 200);
    assert.strictEqual(list.body.total, 2);

    const cmp = await request(app).get('/api/products/compare').query({ ids: `${a._id},${b._id}` });
    assert.strictEqual(cmp.status, 200);
    assert.strictEqual(cmp.body.products.length, 2);
  });

  it('creates a review once per user per product', async () => {
    const signup = await request(app).post('/api/auth/signup').send({
      email: 'rev@example.com',
      password: 'password123',
    });
    const token = signup.body.token;

    const Product = (await import('../src/models/Product.js')).default;
    const p = await Product.create({
      sku: 'R1',
      title: 'Reviewable',
      price: 50,
      condition: 'new',
      stockQuantity: 1,
    });

    const first = await request(app)
      .post(`/api/products/${p._id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, title: 'Great', body: 'Nice' });
    assert.strictEqual(first.status, 201);
    assert.strictEqual(first.body.review.verifiedPurchase, false);

    const dup = await request(app)
      .post(`/api/products/${p._id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4 });
    assert.strictEqual(dup.status, 409);
  });

  it('filters products by taxonomy spec key', async () => {
    const Product = (await import('../src/models/Product.js')).default;
    await Product.create({
      sku: 'SPEC-1',
      title: 'Ram laptop',
      price: 100,
      condition: 'new',
      subcategory: 'Laptops',
      stockQuantity: 1,
      specs: { cpu: 'x', ramGb: 32, storageGb: 256, screenInches: 13, os: 'Linux' },
    });
    const res = await request(app).get('/api/products').query({ specKey: 'ramGb', specValue: '32' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 1);
  });

  it('admin can manage products and order status', async () => {
    const bcrypt = (await import('bcryptjs')).default;
    const User = (await import('../src/models/User.js')).default;
    await User.create({
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'admin',
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'password123',
    });
    assert.strictEqual(login.status, 200);
    const adminToken = login.body.token;

    const create = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'ADM-1',
        title: 'Admin widget',
        price: 9.99,
        condition: 'new',
        subcategory: 'Audio',
        stockQuantity: 3,
        specs: { connectivity: 'BT', batteryHours: 10, noiseCancelling: false },
      });
    assert.strictEqual(create.status, 201);
    const pid = String(create.body.product._id ?? create.body.product.id);

    const cust = await request(app).post('/api/auth/signup').send({
      email: 'cust@example.com',
      password: 'password123',
    });
    const custToken = cust.body.token;

    await request(app)
      .put('/api/cart')
      .set('Authorization', `Bearer ${custToken}`)
      .send({ items: [{ productId: pid, quantity: 1 }] });

    const ord = await request(app).post('/api/orders').set('Authorization', `Bearer ${custToken}`);
    assert.strictEqual(ord.status, 201);
    const oid = ord.body.order.id;

    const patch = await request(app)
      .patch(`/api/admin/orders/${oid}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'shipped' });
    assert.strictEqual(patch.status, 200);
    assert.strictEqual(patch.body.order.status, 'shipped');

    const mine = await request(app).get(`/api/orders/${oid}`).set('Authorization', `Bearer ${custToken}`);
    assert.strictEqual(mine.status, 200);
    assert.strictEqual(mine.body.order.status, 'shipped');
  });

  it('marks reviews as verified when the user purchased the product', async () => {
    const signup = await request(app).post('/api/auth/signup').send({
      email: 'verified@example.com',
      password: 'password123',
    });
    const token = signup.body.token;

    const Product = (await import('../src/models/Product.js')).default;
    const p = await Product.create({
      sku: 'VER-1',
      title: 'Verified item',
      price: 10,
      condition: 'new',
      subcategory: 'Laptops',
      stockQuantity: 2,
      specs: { cpu: 'x', ramGb: 8, storageGb: 128, screenInches: 13, os: 'Linux' },
    });

    await request(app)
      .put('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: p._id.toString(), quantity: 1 }] });

    const ord = await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(ord.status, 201);

    const rev = await request(app)
      .post(`/api/products/${p._id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, title: 'Works', body: 'Good' });
    assert.strictEqual(rev.status, 201);
    assert.strictEqual(rev.body.review.verifiedPurchase, true);
  });

  it('maintains a wishlist per user', async () => {
    const signup = await request(app).post('/api/auth/signup').send({
      email: 'wish@example.com',
      password: 'password123',
    });
    const token = signup.body.token;

    const Product = (await import('../src/models/Product.js')).default;
    const p = await Product.create({
      sku: 'W-1',
      title: 'Wish item',
      price: 5,
      condition: 'new',
      subcategory: 'Audio',
      stockQuantity: 1,
      specs: { connectivity: 'BT', batteryHours: 5, noiseCancelling: false },
    });

    const put = await request(app)
      .put('/api/wishlist')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: p._id.toString() }] });
    assert.strictEqual(put.status, 200);
    assert.strictEqual(put.body.wishlist.items.length, 1);

    const get = await request(app).get('/api/wishlist').set('Authorization', `Bearer ${token}`);
    assert.strictEqual(get.status, 200);
    assert.strictEqual(get.body.wishlist.items[0].productId, p._id.toString());
  });

  it('applies a percent coupon on stub checkout', async () => {
    const Coupon = (await import('../src/models/Coupon.js')).default;
    await Coupon.create({
      code: 'HALF',
      discountType: 'percent',
      value: 50,
      active: true,
    });

    const signup = await request(app).post('/api/auth/signup').send({
      email: 'coupon@example.com',
      password: 'password123',
    });
    const token = signup.body.token;

    const Product = (await import('../src/models/Product.js')).default;
    const p = await Product.create({
      sku: 'CP1',
      title: 'Coupon item',
      price: 100,
      condition: 'new',
      subcategory: 'Laptops',
      stockQuantity: 5,
      specs: { cpu: 'x', ramGb: 8, storageGb: 128, screenInches: 13, os: 'L' },
    });

    await request(app)
      .put('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: p._id.toString(), quantity: 1 }] });

    const ord = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ couponCode: 'HALF' });
    assert.strictEqual(ord.status, 201);
    assert.strictEqual(ord.body.order.subtotalAmount, 100);
    assert.strictEqual(ord.body.order.discountAmount, 50);
    assert.strictEqual(ord.body.order.totalAmount, 50);
  });

  it('surfaces co-purchased products in recommendations', async () => {
    const signup = await request(app).post('/api/auth/signup').send({
      email: 'cop@example.com',
      password: 'password123',
    });
    const token = signup.body.token;

    const Product = (await import('../src/models/Product.js')).default;
    const a = await Product.create({
      sku: 'CO-A',
      title: 'Co A',
      price: 10,
      condition: 'new',
      subcategory: 'Laptops',
      stockQuantity: 5,
      specs: { cpu: 'x', ramGb: 8, storageGb: 128, screenInches: 13, os: 'L' },
    });
    const b = await Product.create({
      sku: 'CO-B',
      title: 'Co B',
      price: 12,
      condition: 'new',
      subcategory: 'Wearables',
      stockQuantity: 5,
      specs: { connectivity: 'BT', batteryDays: 7, waterResistance: '1 ATM' },
    });

    await request(app)
      .put('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          { productId: a._id.toString(), quantity: 1 },
          { productId: b._id.toString(), quantity: 1 },
        ],
      });
    await request(app).post('/api/orders').set('Authorization', `Bearer ${token}`);

    const rec = await request(app).get(`/api/products/${a._id}/recommendations`);
    assert.strictEqual(rec.status, 200);
    assert.ok(rec.body.products.some((p) => p.id === b._id.toString()));
  });

  it('returns admin analytics summary', async () => {
    const bcrypt = (await import('bcryptjs')).default;
    const User = (await import('../src/models/User.js')).default;
    await User.create({
      email: 'analytics@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'admin',
    });
    const login = await request(app).post('/api/auth/login').send({
      email: 'analytics@example.com',
      password: 'password123',
    });
    const res = await request(app)
      .get('/api/admin/analytics/summary')
      .set('Authorization', `Bearer ${login.body.token}`);
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.revenueByCurrency));
    assert.ok(Array.isArray(res.body.topSkus));
  });

  it('exposes public config for storefront (legal URLs and region defaults)', async () => {
    const prevP = process.env.PRIVACY_POLICY_URL;
    const prevT = process.env.TERMS_OF_SERVICE_URL;
    const prevSUrl = process.env.SUPPORT_URL;
    const prevSEm = process.env.SUPPORT_EMAIL;
    process.env.PRIVACY_POLICY_URL = 'https://example.com/privacy';
    process.env.TERMS_OF_SERVICE_URL = 'https://example.com/terms';
    process.env.SUPPORT_URL = 'https://example.com/help';
    process.env.SUPPORT_EMAIL = 'help@example.com';
    try {
      const res = await request(app).get('/api/public/config');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.privacyPolicyUrl, 'https://example.com/privacy');
      assert.strictEqual(res.body.termsOfServiceUrl, 'https://example.com/terms');
      assert.strictEqual(res.body.supportUrl, 'https://example.com/help');
      assert.strictEqual(res.body.supportEmail, 'help@example.com');
      assert.ok('defaultCurrency' in res.body);
    } finally {
      if (prevP === undefined) delete process.env.PRIVACY_POLICY_URL;
      else process.env.PRIVACY_POLICY_URL = prevP;
      if (prevT === undefined) delete process.env.TERMS_OF_SERVICE_URL;
      else process.env.TERMS_OF_SERVICE_URL = prevT;
      if (prevSUrl === undefined) delete process.env.SUPPORT_URL;
      else process.env.SUPPORT_URL = prevSUrl;
      if (prevSEm === undefined) delete process.env.SUPPORT_EMAIL;
      else process.env.SUPPORT_EMAIL = prevSEm;
    }
  });

  it('finds products via text-capable search', async () => {
    const Product = (await import('../src/models/Product.js')).default;
    await Product.create({
      sku: 'TXT-99',
      title: 'NexaSpark Quantum Headset XYZ',
      description: 'noise isolating premium audio',
      price: 1,
      condition: 'new',
      subcategory: 'Audio',
      stockQuantity: 1,
      specs: { connectivity: 'BT', batteryHours: 20, noiseCancelling: true },
    });
    const res = await request(app).get('/api/products').query({ q: 'Quantum Headset' });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.total >= 1);
    assert.ok(res.body.products.some((p) => p.sku === 'TXT-99'));
  });
});
