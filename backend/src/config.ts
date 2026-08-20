import 'dotenv/config';

function num(v: string | undefined, d: number): number {
  const n = v ? parseFloat(v) : NaN;
  return Number.isNaN(n) ? d : n;
}

const env = process.env.MELD_ENV ?? 'sandbox';
const key = process.env.MELD_API_KEY ?? '';
const forceMock = (process.env.FORCE_MOCK ?? '').toLowerCase() === 'true';

export const config = {
  meldKey: key,
  meldEnv: env,
  meldVersion: process.env.MELD_VERSION ?? '2026-02-03',
  meldBase: env === 'production' ? 'https://api.meld.io' : 'https://api-sb.meld.io',
  meldPublicBase: 'https://api.meld.io', // public discovery, no auth
  // Mock mode when there is no key, or when explicitly forced.
  mock: forceMock || key.length === 0,
  port: parseInt(process.env.PORT ?? '8787', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  redirectUrl: process.env.REDIRECT_URL ?? 'http://localhost:5173/done',
  mockEphemeralPrefix: process.env.MOCK_EPHEMERAL_PREFIX ?? '5Ephemeral',
  buffers: {
    convRate: num(process.env.HOST_CONV_RATE, 1),
    convBuffer: num(process.env.HOST_CONV_BUFFER, 0.01),
    gasReserve: num(process.env.HOST_GAS_RESERVE, 0.02),
    existential: num(process.env.DEST_EXISTENTIAL, 0.01),
    slippageCard: num(process.env.SLIPPAGE_CARD, 0.01),
    slippageBank: num(process.env.SLIPPAGE_BANK, 0.02),
  },
};
