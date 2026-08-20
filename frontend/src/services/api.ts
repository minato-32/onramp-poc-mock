import type { Country, Method, QuoteResult, SessionResult, CoinageSession, RouteAvailability } from '../types';
import { log } from '../composables/useLog';

/** Short one-line summary of a response body for the activity log. */
function summarize(path: string, d: any): string | undefined {
  if (!d || typeof d !== 'object') return undefined;
  if (path.includes('/health')) return `mode=${d.mode} · meldEnv=${d.meldEnv}`;
  if (path.includes('/regions')) return Array.isArray(d) ? `${d.length} countries` : undefined;
  if (path.includes('/routes')) return `available=${d.available} · methods=[${(d.methods ?? []).map((m: any) => m.type).join(', ')}]`;
  if (path.includes('/quote')) {
    if (d.unavailable) return 'unavailable (no provider)';
    return `charge=${d.charge} ${d.fiat} · via ${d.serviceProvider} · receive≈${d.receiveAmount}`;
  }
  if (path.includes('/fx')) return d.rate != null ? `1 ${d.from} = ${Number(d.rate).toFixed(4)} ${d.to}` : undefined;
  if (path.includes('/session')) return d.sessionId ? `sessionId=${d.sessionId}` : undefined;
  if (path.includes('/status/')) return d.status ? `status=${d.status}` : undefined;
  if (path.includes('/coinage')) return d.id ? `phase=${d.phase}` : undefined;
  return undefined;
}

async function j<T>(path: string, opts?: RequestInit): Promise<T> {
  const method = opts?.method ?? 'GET';
  log('call', `${method} ${path}`);
  const start = performance.now();
  let r: Response;
  try {
    r = await fetch(path, { headers: { 'content-type': 'application/json' }, ...opts });
  } catch (e) {
    log('err', `${method} ${path} — network error`, (e as Error).message, Math.round(performance.now() - start));
    throw e;
  }
  const ms = Math.round(performance.now() - start);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    log('err', `${method} ${path} → ${r.status}`, (d as any).error || r.statusText, ms);
    throw new Error((d as any).error || r.statusText);
  }
  log('ok', `${method} ${path} → ${r.status}`, summarize(path, d), ms);
  return d as T;
}
const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export const onrampApi = {
  health: () => j<{ ok: boolean; mode: 'mock' | 'live'; meldEnv: string }>('/api/onramp/health'),
  regions: () => j<Country[]>('/api/onramp/regions'),
  routes: (country: string, fiat: string, token: string) =>
    j<RouteAvailability>(`/api/onramp/routes?country=${country}&fiat=${fiat}&token=${token}`),
  quote: (body: { amount: number; fiat: string; token: string; country: string; method: Method }) =>
    j<QuoteResult>('/api/onramp/quote', post(body)),
  session: (body: { quote: QuoteResult; walletAddress: string }) =>
    j<SessionResult>('/api/onramp/session', post(body)),
  status: (id: string) => j<{ status: string; mock?: boolean }>(`/api/onramp/status/${id}`),
  fx: (to: string, from = 'USD') =>
    j<{ from: string; to: string; rate: number; asOf: number }>(`/api/onramp/fx?from=${from}&to=${to}`),
};

export const coinageApi = {
  create: (target: number, token: string) => j<CoinageSession>('/api/coinage/session', post({ target, token })),
  deliver: (id: string) => j<CoinageSession>(`/api/coinage/deliver/${id}`, { method: 'POST' }),
  get: (id: string) => j<CoinageSession>(`/api/coinage/${id}`),
};
