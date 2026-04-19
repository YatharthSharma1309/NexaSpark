import assert from 'node:assert';
import { describe, it } from 'node:test';
import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/health', () => {
  it('returns 200 and status ok', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.service, 'nexaspark-api');
    assert.ok(typeof res.body.time === 'string');
  });
});
