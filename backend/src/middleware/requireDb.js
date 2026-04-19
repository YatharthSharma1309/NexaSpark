import mongoose from 'mongoose';
import { AppError } from '../lib/errors.js';

export function requireDb(_req, _res, next) {
  if (mongoose.connection.readyState !== 1) {
    next(new AppError(503, 'DATABASE_UNAVAILABLE', 'Database is not connected'));
    return;
  }
  next();
}
