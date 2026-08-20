import { config } from '../config.js';
import type { CoinageSession, CoinagePhase } from '../types.js';

/**
 * Mock coinage handoff — models the getsome `tb/coinage-handoff` flow:
 * a per-session ephemeral Asset Hub address receives native DOT, which is swapped
 * to CASH, XCM'd to People chain, and topped up into coinage. Swaps to the real
 * `@onramp/*` packages once shared.
 */

type Internal = CoinageSession & { advanceAt: number; delivering: boolean };
const store = new Map<string, Internal>();
const ORDER: CoinagePhase[] = ['awaiting-deposit', 'swapping', 'moving', 'topping-up', 'done'];
const STEP_MS = 1000;

const rid = (p: string) => p + Math.random().toString(36).slice(2, 10);
const strip = (s: Internal): CoinageSession => {
  const { advanceAt: _a, delivering: _d, ...rest } = s;
  return rest;
};

export function createCoinageSession(target: number, token: string): CoinageSession {
  const s: Internal = {
    id: rid('coin_'),
    // per-session ephemeral/burner Asset Hub address (privacy-preserving stand-in)
    ephemeralAddress: config.mockEphemeralPrefix + Math.random().toString(36).slice(2, 12) + 'Hub',
    target,
    token,
    phase: 'awaiting-deposit',
    advanceAt: 0,
    delivering: false,
  };
  store.set(s.id, s);
  return strip(s);
}

/** Simulate: the native DOT deposit landed on the ephemeral address — start advancing. */
export function deliverToCoinage(id: string): CoinageSession | null {
  const s = store.get(id);
  if (!s) return null;
  s.delivering = true;
  s.advanceAt = Date.now();
  return strip(s);
}

/** Poll — auto-advances one phase per STEP_MS once delivery started. */
export function getCoinage(id: string): CoinageSession | null {
  const s = store.get(id);
  if (!s) return null;
  if (s.delivering && s.phase !== 'done' && Date.now() - s.advanceAt >= STEP_MS) {
    const idx = ORDER.indexOf(s.phase);
    if (idx < ORDER.length - 1) {
      s.phase = ORDER[idx + 1];
      s.advanceAt = Date.now();
      if (s.phase === 'done') s.coinageCredited = s.target;
    }
  }
  return strip(s);
}
