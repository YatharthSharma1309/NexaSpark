import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import request from 'supertest';

describe('API smoke (no database)', () => {
  /** @type {import('express').Express} */
  let app;

  before(async () => {
    process.env.NODE_ENV = 'test';
    const mod = await import('../src/app.js');
    app = mod.default;
  });

  describe('GET /api/health', () => {
    it('returns 200 and status ok', async () => {
      const res = await request(app).get('/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.service, 'nexaspark-api');
      assert.ok(typeof res.body.time === 'string');
    });
  });

  describe('GET /api/taxonomy', () => {
    it('returns electronics tree and spec keys', async () => {
      const res = await request(app).get('/api/taxonomy');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.topCategory, 'Electronics');
      assert.ok(Array.isArray(res.body.categoryTree.Electronics));
      assert.ok(res.body.specKeysBySubcategory.Laptops.length >= 1);
    });
  });
});
