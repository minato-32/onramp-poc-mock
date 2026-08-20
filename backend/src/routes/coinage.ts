import { Router } from 'express';
import { createCoinageSession, deliverToCoinage, getCoinage } from '../services/coinage-mock.js';

export const coinageRouter = Router();

// Create a coinage session -> issues the per-session ephemeral Asset Hub address.
coinageRouter.post('/session', (req, res) => {
  const { target, token } = req.body ?? {};
  if (!target || !token) return res.status(400).json({ error: 'target, token required' });
  res.json(createCoinageSession(Number(target), token));
});

// Simulate the native DOT deposit landing on the ephemeral address.
coinageRouter.post('/deliver/:id', (req, res) => {
  const s = deliverToCoinage(req.params.id);
  if (!s) return res.status(404).json({ error: 'unknown coinage session' });
  res.json(s);
});

// Poll the handoff phase (awaiting-deposit -> swapping -> moving -> topping-up -> done).
coinageRouter.get('/:id', (req, res) => {
  const s = getCoinage(req.params.id);
  if (!s) return res.status(404).json({ error: 'unknown coinage session' });
  res.json(s);
});
