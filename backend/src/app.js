import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN;
app.use(
  cors({
    origin: clientOrigin || true,
    credentials: Boolean(clientOrigin),
  })
);
app.use(helmet());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'nexaspark-api',
    time: new Date().toISOString(),
  });
});

export default app;
