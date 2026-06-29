/**
 * auth.js
 *
 * Postgres-backed register/login and JWT middleware.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { query } from '../db.js';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'replace_with_a_real_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function register(username, password) {
  const exists = await query('SELECT id FROM users WHERE username=$1', [username]);
  if (exists.rowCount > 0) {
    throw new Error('User exists');
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const res = await query('INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at', [username, passwordHash]);
  return res.rows[0];
}

export async function login(username, password) {
  const res = await query('SELECT id, username, password_hash FROM users WHERE username=$1', [username]);
  if (res.rowCount === 0) throw new Error('Invalid credentials');
  const user = res.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error('Invalid credentials');

  // issue JWT
  const payload = { sub: user.id, username: user.username };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { token, username: user.username, userId: user.id };
}

export function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, username: payload.username, token };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export default { register, login, requireAuth };
