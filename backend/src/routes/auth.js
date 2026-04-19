import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/errors.js';
import { assertEmail, assertPassword } from '../lib/validation.js';
import { requireDb } from '../middleware/requireDb.js';
import User from '../models/User.js';

const router = Router();

function userPublic(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role || 'customer',
  };
}

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError(500, 'CONFIG_ERROR', 'JWT_SECRET is not configured');
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    { sub: user._id.toString(), role: user.role || 'customer' },
    secret,
    { expiresIn }
  );
}

router.post(
  '/signup',
  requireDb,
  asyncHandler(async (req, res) => {
    const email = assertEmail(req.body?.email);
    const password = assertPassword(req.body?.password);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 120) : '';

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name });

    const token = signToken(user);
    res.status(201).json({ user: userPublic(user), token });
  })
);

router.post(
  '/login',
  requireDb,
  asyncHandler(async (req, res) => {
    const email = assertEmail(req.body?.email);
    const password = assertPassword(req.body?.password);

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = signToken(user);
    res.json({ user: userPublic(user), token });
  })
);

export default router;
