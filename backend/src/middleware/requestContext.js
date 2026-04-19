import { randomUUID } from 'node:crypto';

export function requestContext(req, res, next) {
  const id =
    typeof req.headers['x-request-id'] === 'string' && req.headers['x-request-id'].trim()
      ? req.headers['x-request-id'].trim().slice(0, 120)
      : randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const line = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl?.split('?')[0] ?? req.path,
      status: res.statusCode,
      ms: Date.now() - start,
    };
    if (res.statusCode >= 500) {
      console.error(JSON.stringify(line));
    } else {
      console.log(JSON.stringify(line));
    }
  });
  next();
}
