import express from 'express';
import { requireAuth } from '../auth.js';
import { upgradeUserToPremium, checkPremium } from '../premium.js';

const router = express.Router();

// Demo: POST /api/premium/upgrade { days: 30 } -> upgrades current user (no payment flow)
router.post('/upgrade', requireAuth, async (req, res) => {
  try {
    const days = Number(req.body.days || 30);
    const r = await upgradeUserToPremium(req.user.id, days);
    res.json({ ok: true, premium: r });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/premium/status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const status = await checkPremium(req.user.id);
    res.json({ ok: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
