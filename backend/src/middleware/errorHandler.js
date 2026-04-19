import { AppError } from '../lib/errors.js';

/**
 * Express error-handling middleware (four arguments).
 */
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  if (err?.name === 'ValidationError' && err?.errors) {
    const first = Object.values(err.errors)[0];
    const message = first?.message || 'Validation failed';
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message },
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      error: { code: 'DUPLICATE', message: 'Resource already exists' },
    });
  }

  console.error(
    JSON.stringify({
      requestId: _req.requestId,
      err: err instanceof Error ? err.message : String(err),
    })
  );
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
  });
}
