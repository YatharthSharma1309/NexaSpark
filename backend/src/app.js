import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AppError } from './lib/errors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestContext, requestLogger } from './middleware/requestContext.js';
import { authRouterLimiter } from './middleware/rateLimits.js';
import authRouter from './routes/auth.js';
import cartRouter from './routes/cart.js';
import ordersRouter from './routes/orders.js';
import productsRouter from './routes/products.js';
import taxonomyRouter from './routes/taxonomy.js';
import adminRouter from './routes/admin/index.js';
import stripeCheckoutRouter from './routes/stripeCheckout.js';
import { stripeWebhook } from './routes/stripeWebhook.js';
import wishlistRouter from './routes/wishlist.js';
import publicConfigRouter from './routes/publicConfig.js';

const app = express();

app.use(requestContext);
app.use(requestLogger);

const clientOrigin = process.env.CLIENT_ORIGIN;
app.use(
  cors({
    origin: clientOrigin || true,
    credentials: Boolean(clientOrigin),
  })
);
app.use(helmet());

app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    stripeWebhook(req, res).catch(next);
  }
);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'nexaspark-api',
    time: new Date().toISOString(),
  });
});

app.use('/api/public', publicConfigRouter);

app.use('/api/auth', authRouterLimiter, authRouter);
app.use('/api/taxonomy', taxonomyRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/stripe', stripeCheckoutRouter);
app.use('/api/admin', adminRouter);

app.use((_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Resource not found'));
});

app.use(errorHandler);

export default app;
