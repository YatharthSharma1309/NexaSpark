import { randomBytes } from 'node:crypto';
import { parse } from 'cookie';

const COOKIE = 'nexaspark_sid';
const idRe = /^[a-f0-9]{32}$/;

/**
 * Ensures a stable guest id (httpOnly cookie) for cart and future auth merge.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function guestSession(req, res, next) {
  const cookies = parse(req.headers.cookie || '');
  let sid = cookies[COOKIE];
  if (!sid || !idRe.test(sid)) {
    sid = randomBytes(16).toString('hex');
  }
  req.guestId = sid;
  res.cookie(COOKIE, sid, {
    maxAge: 1000 * 60 * 60 * 24 * 400,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  next();
}
