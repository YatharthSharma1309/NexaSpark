import { AppError } from '../lib/errors.js';

export function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    next(new AppError(403, 'FORBIDDEN', 'Admin access required'));
    return;
  }
  next();
}
