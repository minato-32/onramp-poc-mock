import type { QuoteInput, QuoteResult, SessionResult } from '../types.js';

/** Mock Meld responses so the full flow runs locally without a key. */

// Rough demo rates: dest-crypto per 1 unit of fiat (not real prices).
const RATE: Record<string, number> = { DOT_ASSETHUB: 0.15, USDC_ASSETHUB: 0.9, USDT_ASSETHUB: 0.9 };
const FEE_RATIO = 0.03; // 3% provider fee
const NET_FEE = 0.01; // flat network fee (dest units)

const round2 = (n: number) => Math.round(n * 100) / 100;
const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

// Forward quote: user spends a fixed fiat `amount`, Meld returns the token they receive.
export function mockQuote(input: QuoteInput): QuoteResult {
  const rate = RATE[input.token] ?? 0.15;
  const source = input.amount;
  const providers = [
    { serviceProvider: 'TRANSAK', factor: 1.0 },
    { serviceProvider: 'KOYWE', factor: 0.985 }, // slightly worse rate
  ].map((p) => ({
    serviceProvider: p.serviceProvider,
    sourceAmount: round2(source),
    destinationAmount: round6(source * rate * p.factor * (1 - FEE_RATIO) - NET_FEE),
    totalFee: round2(source * FEE_RATIO),
  }));
  // best for the user = most token received for the same spend
  const best = providers.reduce((a, b) => (b.destinationAmount > a.destinationAmount ? b : a));
  return {
    charge: best.sourceAmount,
    fiat: input.fiat,
    targetToken: input.token,
    receiveAmount: best.destinationAmount,
    country: input.country,
    method: input.method,
    serviceProvider: best.serviceProvider,
    mock: true,
    breakdown: {
      sourceAmount: best.sourceAmount,
      sourceAmountWithoutFees: round2(best.sourceAmount * (1 - FEE_RATIO)),
      totalFee: best.totalFee,
      transactionFee: round2(best.totalFee * 0.7),
      networkFee: NET_FEE,
      exchangeRate: rate,
      destinationAmount: best.destinationAmount,
    },
    providers,
  };
}

const sessions = new Map<string, { polls: number }>();

export function mockSession(_quote: QuoteResult): SessionResult {
  const id = 'mock_' + Math.random().toString(36).slice(2, 10);
  sessions.set(id, { polls: 0 });
  return { sessionId: id, serviceProviderWidgetUrl: '(mock — inline pay panel)', mock: true };
}

export function mockStatus(id: string): { status: string; mock: boolean; transactionId: string } {
  const s = sessions.get(id) ?? { polls: 99 };
  s.polls += 1;
  sessions.set(id, s);
  return { status: s.polls >= 2 ? 'SETTLED' : 'PENDING', mock: true, transactionId: id };
}
