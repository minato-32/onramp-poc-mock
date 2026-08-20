import { config } from '../config.js';
import type { QuoteInput, QuoteResult, SessionResult } from '../types.js';

/** Real Meld client. Public discovery is no-auth; quote/session/status need the key. */

function authHeaders(): Record<string, string> {
  return {
    Authorization: `BASIC ${config.meldKey}`, // literal BASIC + raw key (not base64)
    'Meld-Version': config.meldVersion,
    'content-type': 'application/json',
    accept: 'application/json',
  };
}
async function pub(path: string): Promise<any> {
  const r = await fetch(`${config.meldPublicBase}${path}`, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(`Meld public ${path} -> ${r.status}`);
  return r.json();
}
async function authGet(path: string): Promise<any> {
  const r = await fetch(`${config.meldBase}${path}`, { headers: authHeaders() });
  if (!r.ok) throw new Error(`Meld ${path} -> ${r.status}: ${await r.text()}`);
  return r.json();
}
async function authPost(path: string, body: unknown): Promise<any> {
  const r = await fetch(`${config.meldBase}${path}`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`Meld ${path} -> ${r.status}: ${await r.text()}`);
  return r.json();
}

/** Public discovery — usable in both real and mock modes (no key). */
export const meldPublic = {
  countries: async () => (await pub('/network-partner/supported/countries?category=CRYPTO_ONRAMP')).countries ?? [],
  paymentMethods: (c: string) => pub(`/network-partner/supported/payment-methods?category=CRYPTO_ONRAMP&country=${encodeURIComponent(c)}`),
  routes: (c: string, f: string, t: string) => pub(`/network-partner/supported/routes/CRYPTO_ONRAMP/${c}/${f}/${t}`),
};

/** Forward quote: give Meld sourceAmount (fiat spent), it returns destinationAmount (token). */
export async function realQuote(input: QuoteInput): Promise<QuoteResult> {
  const resp: any = await authPost('/payments/crypto/quote', {
    countryCode: input.country,
    sourceCurrencyCode: input.fiat,
    destinationCurrencyCode: input.token,
    sourceAmount: String(input.amount),
    paymentMethodType: input.method,
  });
  const raw: any[] = resp.quotes ?? (Array.isArray(resp) ? resp : []);
  if (!raw.length) throw new Error('NO_PROVIDERS');
  const norm = raw.map((q) => ({
    serviceProvider: q.serviceProvider,
    sourceAmount: Number(q.sourceAmount),
    destinationAmount: Number(q.destinationAmount),
    totalFee: Number(q.totalFee ?? 0),
    transactionFee: Number(q.transactionFee ?? 0),
    networkFee: Number(q.networkFee ?? 0),
    sourceAmountWithoutFees: Number(q.sourceAmountWithoutFees ?? 0),
    exchangeRate: Number(q.exchangeRate ?? 0),
    customerScore: Number(q.customerScore ?? q.rampIntelligence?.rampScore ?? 0),
  }));
  // best for the user = most token received for the same spend
  norm.sort((a, b) => b.destinationAmount - a.destinationAmount || b.customerScore - a.customerScore);
  const best = norm[0];
  return {
    charge: best.sourceAmount,
    fiat: input.fiat,
    targetToken: input.token,
    receiveAmount: best.destinationAmount,
    country: input.country,
    method: input.method,
    serviceProvider: best.serviceProvider,
    mock: false,
    breakdown: {
      sourceAmount: best.sourceAmount,
      sourceAmountWithoutFees: best.sourceAmountWithoutFees,
      totalFee: best.totalFee,
      transactionFee: best.transactionFee,
      networkFee: best.networkFee,
      exchangeRate: best.exchangeRate,
      destinationAmount: best.destinationAmount,
    },
    providers: norm.map((q) => ({ serviceProvider: q.serviceProvider, sourceAmount: q.sourceAmount, destinationAmount: q.destinationAmount, totalFee: q.totalFee })),
  };
}

/** Create a BUY session; `walletAddress` is the host ephemeral Asset Hub address. */
export async function realSession(quote: QuoteResult, walletAddress: string): Promise<SessionResult> {
  const r: any = await authPost('/crypto/session/widget', {
    sessionType: 'BUY',
    sessionData: {
      serviceProvider: quote.serviceProvider,
      countryCode: quote.country,
      sourceCurrencyCode: quote.fiat,
      sourceAmount: String(quote.charge),
      destinationCurrencyCode: quote.targetToken,
      walletAddress,
      paymentMethodType: quote.method,
      lockFields: ['walletAddress', 'cryptoCurrency'],
      redirectUrl: config.redirectUrl,
    },
  });
  return { sessionId: r.id ?? r.sessionId ?? '', serviceProviderWidgetUrl: r.serviceProviderWidgetUrl ?? r.widgetUrl ?? '', mock: false };
}

export function realStatus(id: string): Promise<any> {
  return authGet(`/payments/transactions/${encodeURIComponent(id)}`);
}
