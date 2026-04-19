import mongoose from 'mongoose';
import { AppError } from './errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function assertEmail(email) {
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    throw new AppError(400, 'INVALID_EMAIL', 'Valid email is required');
  }
  return email.trim().toLowerCase();
}

export function assertPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new AppError(400, 'INVALID_PASSWORD', 'Password must be at least 8 characters');
  }
  return password;
}

/**
 * @param {unknown} id
 * @param {string} [field]
 */
export function parseObjectId(id, field = 'id') {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
    throw new AppError(400, 'INVALID_ID', `Invalid ${field}`);
  }
  return id;
}

export function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
