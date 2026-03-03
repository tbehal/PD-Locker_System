import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config';
import logger from '../logger';
import respond from '../middleware/respond';
import type { CookieOptions } from 'express';

const router = Router();

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'lax',
  maxAge: 8 * 60 * 60 * 1000,
  path: '/',
};

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Admin login
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               data:
 *                 authenticated: true
 *               message: Login successful.
 *       400:
 *         description: Password is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Password is required.
 *       401:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: Invalid password.
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body as { password?: string };
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    let isValid = false;

    if (config.adminPasswordHash) {
      isValid = await bcrypt.compare(password, config.adminPasswordHash);
    } else if (config.nodeEnv !== 'production') {
      isValid = password === 'admin123';
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    const token = jwt.sign({ role: 'admin' }, config.jwtSecret, { expiresIn: '8h' });
    res.cookie('token', token, COOKIE_OPTIONS);
    respond.ok(res, { authenticated: true }, 'Login successful.');
  } catch (err) {
    logger.error({ err }, 'Login error');
    res.status(500).json({ error: 'Login failed.' });
  }
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Admin logout
 *     security: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               data:
 *                 authenticated: false
 *               message: Logged out.
 */
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: 0 });
  respond.ok(res, { authenticated: false }, 'Logged out.');
});

/**
 * @openapi
 * /api/auth/check:
 *   get:
 *     tags: [Auth]
 *     summary: Check authentication status
 *     security: []
 *     responses:
 *       200:
 *         description: Authentication status (always 200, check data.authenticated)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             examples:
 *               authenticated:
 *                 value:
 *                   data:
 *                     authenticated: true
 *               unauthenticated:
 *                 value:
 *                   data:
 *                     authenticated: false
 */
router.get('/check', (req: Request, res: Response) => {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    return respond.ok(res, { authenticated: false }, 'Unauthenticated.');
  }

  try {
    jwt.verify(token, config.jwtSecret);
    respond.ok(res, { authenticated: true }, 'Authenticated.');
  } catch {
    respond.ok(res, { authenticated: false }, 'Unauthenticated.');
  }
});

export default router;
