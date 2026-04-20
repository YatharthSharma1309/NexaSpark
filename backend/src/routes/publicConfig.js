import { Router } from 'express';

const router = Router();

/** Safe, non-secret strings for clients (e.g. static storefront). */
router.get('/config', (_req, res) => {
  res.json({
    privacyPolicyUrl: process.env.PRIVACY_POLICY_URL?.trim() || null,
    termsOfServiceUrl: process.env.TERMS_OF_SERVICE_URL?.trim() || null,
    defaultCurrency: process.env.DEFAULT_CURRENCY?.trim() || null,
    defaultCountry: process.env.DEFAULT_COUNTRY?.trim() || null,
    locale: process.env.LOCALE?.trim() || null,
  });
});

export default router;
