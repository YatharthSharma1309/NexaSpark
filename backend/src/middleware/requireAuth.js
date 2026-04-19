import jwt from 'jsonwebtoken';
import { AppError } from '../lib/errors.js';
import User from '../models/User.js';

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    next(new AppError(500, 'CONFIG_ERROR', 'JWT_SECRET is not configured'));
    return;
  }

  try {
    const payload = jwt.verify(token, secret);
    const sub = typeof payload.sub === 'string' ? payload.sub : undefined;
    if (!sub) {
      next(new AppError(401, 'UNAUTHORIZED', 'Invalid token'));
      return;
    }
    const user = await User.findById(sub).select('-passwordHash');
    if (!user) {
      next(new AppError(401, 'UNAUTHORIZED', 'User not found'));
      return;
    }
    req.user = user;
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
  }
}
