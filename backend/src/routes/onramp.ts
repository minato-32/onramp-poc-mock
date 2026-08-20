import { Router } from 'express';
import { config } from '../config.js';
import { meldPublic, realQuote, realSession, realStatus } from '../services/meld.js';
import { mockQuote, mockSession, mockStatus } from '../services/meld-mock.js';

export const onrampRouter = Router();

onrampRouter.get('/health', (_req, res) => {
  res.json({ ok: true, mode: config.mock ? 'mock' : 'live', meldEnv: config.meldEnv });
});

// --- public discovery (keyless; works in both modes) ---
onrampRouter.get('/regions', async (_req, res) => {
  try {
    res.json(await meldPublic.countries());
  } catch {
    res.json(FALLBACK_COUNTRIES); // offline fallback for a fully-local demo
  }
});

onrampRouter.get('/methods', async (req, res) => {
  try {
    res.json(await meldPublic.paymentMethods(String(req.query.country ?? '')));
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

onrampRouter.get('/routes', async (req, res) => {
  const { country, fiat, token } = req.query as Record<string, string>;
  if (!country || !fiat || !token) return res.status(400).json({ error: 'country, fiat, token required' });
  try {
    const raw: any[] = await meldPublic.routes(country, fiat, token);
    res.json(parseRoutes(raw, fiat));
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

// --- quote / session / status (real via key, else mock) ---
onrampRouter.post('/quote', async (req, res) => {
  const input = req.body;
  if (!input?.amount || !input?.fiat || !input?.token || !input?.country || !input?.method) {
    return res.status(400).json({ error: 'amount, fiat, token, country, method required' });
  }
  try {
    res.json(config.mock ? mockQuote(input) : await realQuote(input));
  } catch (e: any) {
    if (e.message === 'NO_PROVIDERS') return res.json({ unavailable: true, providers: [] });
    res.status(502).json({ error: e.message });
  }
});

onrampRouter.post('/session', async (req, res) => {
  const { quote, walletAddress } = req.body ?? {};
  if (!quote) return res.status(400).json({ error: 'quote required' });
  try {
    res.json(config.mock ? mockSession(quote) : await realSession(quote, walletAddress || '<host-ephemeral>'));
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

onrampRouter.get('/status/:id', async (req, res) => {
  try {
    res.json(config.mock ? mockStatus(req.params.id) : await realStatus(req.params.id));
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

function parseRoutes(raw: any[], fiat: string) {
  const byType: Record<string, { type: string; min: number; max: number; currency: string; providers: string[] }> = {};
  for (const partner of raw) {
    for (const pm of partner.paymentMethods ?? []) {
      const t = pm.paymentType;
      const lim = pm.limits ?? {};
      if (!byType[t]) byType[t] = { type: t, min: Number(lim.min ?? 0), max: 0, currency: lim.currencyCode ?? fiat, providers: [] };
      if (lim.min != null) byType[t].min = Math.min(byType[t].min || Number(lim.min), Number(lim.min));
      if (lim.max != null) byType[t].max = Math.max(byType[t].max, Number(lim.max));
      if (partner.partner && !byType[t].providers.includes(partner.partner)) byType[t].providers.push(partner.partner);
    }
  }
  return { available: raw.length > 0, methods: Object.values(byType), providerCount: raw.length };
}

const FALLBACK_COUNTRIES = [
  { countryCode: 'BR', name: 'Brazil', flag: '', subdivisions: [] },
  { countryCode: 'MX', name: 'Mexico', flag: '', subdivisions: [] },
  { countryCode: 'DE', name: 'Germany', flag: '', subdivisions: [] },
  { countryCode: 'GB', name: 'United Kingdom', flag: '', subdivisions: [] },
  { countryCode: 'US', name: 'United States', flag: '', subdivisions: [] },
  { countryCode: 'AR', name: 'Argentina', flag: '', subdivisions: [] },
];
