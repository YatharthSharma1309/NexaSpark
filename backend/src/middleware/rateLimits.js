import rateLimit from 'express-rate-limit';

const skipInTest = () => process.env.NODE_ENV === 'test';

export const authRouterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});

export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
});
