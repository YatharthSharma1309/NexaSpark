import { Router } from 'express';
import { getCachedTaxonomyResponse } from '../lib/taxonomyCache.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(getCachedTaxonomyResponse());
});

export default router;
