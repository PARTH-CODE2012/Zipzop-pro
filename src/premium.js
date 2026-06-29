import { query } from './db.js';

/**
 * Simple premium helper for demo:
 * - upgradeUserToPremium(userId, days)
 * - checkPremium(userId)
 */

export async function upgradeUserToPremium(userId, days = 30) {
  const res = await query(
    "UPDATE users SET is_premium = true, premium_expires = now() + ($1 || ' days')::interval WHERE id=$2 RETURNING id, is_premium, premium_expires",
    [String(days), userId]
  );
  return res.rows[0];
}

export async function checkPremium(userId) {
  const res = await query("SELECT is_premium, premium_expires FROM users WHERE id=$1", [userId]);
  if (res.rowCount === 0) return { is_premium: false, premium_expires: null };
  const r = res.rows[0];
  const active = r.is_premium && r.premium_expires && new Date(r.premium_expires) > new Date();
  return { is_premium: active, premium_expires: r.premium_expires };
}

export function requirePremium(req, res, next) {
  if (!req.user || !req.user.id) return res.status(401).json({ error: 'Not authenticated' });
  checkPremium(req.user.id).then((status) => {
    if (status.is_premium) {
      req.user.premium = status;
      next();
    } else {
      res.status(402).json({ error: 'Premium required' });
    }
  }).catch((err) => {
    console.error('premium check error', err);
    res.status(500).json({ error: 'Internal error' });
  });
}
