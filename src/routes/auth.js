import express from 'express';
import { register, login } from '../auth.js';
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const user = await register(username, password);
    res.json({ ok: true, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await login(username, password);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

export default router;
