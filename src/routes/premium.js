import express from 'express';
import { requireAuth } from '../auth.js';
import { upgradeUserToPremium, checkPremium } from '../premium.js';

const router = express.Router();

router.post('/upgrade', requireAuth, async (req, res) => {
  try {
    const days = Number(req.body.days || 30);
    const r = await upgradeUserToPremium(req.user.id, days);
    res.json({ ok: true, premium: r });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status', requireAuth, async (req, res) => {
  try {
    const status = await checkPremium(req.user.id);
    res.json({ ok: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
