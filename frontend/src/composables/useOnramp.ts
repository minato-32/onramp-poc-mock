import { reactive } from 'vue';
import { onrampApi, coinageApi } from '../services/api';
import { log } from './useLog';
import type { Country, Method, QuoteResult, SessionResult, CoinageSession, RouteAvailability } from '../types';

export type Step = 'region' | 'method' | 'amount' | 'pay' | 'coinage' | 'done';

// Fiat is fixed to USD for the PoC (no per-country BRL/EUR mapping yet).
const FIAT = 'USD';

// Single-flow PoC: module-level reactive state shared across components.
const state = reactive({
  mode: 'mock' as 'mock' | 'live',
  step: 'region' as Step,
  countries: [] as Country[],
  country: '',
  fiat: FIAT,
  availability: null as RouteAvailability | null,
  method: '' as Method | '',
  amount: 100, // fiat USD the user spends (source) — may come from ?amount=
  amountLocked: false, // amount supplied via query param
  methodLocked: false, // method supplied via query param
  token: 'DOT_ASSETHUB',
  quote: null as QuoteResult | null,
  session: null as SessionResult | null,
  coinage: null as CoinageSession | null,
  loading: false,
  error: '',
});

/** Read ?amount= and ?method= from the launch URL (host-launched onramp style). */
function readParams() {
  const q = new URLSearchParams(window.location.search);
  const amt = Number(q.get('amount'));
  if (amt > 0) {
    state.amount = amt;
    state.amountLocked = true;
    log('info', `Param: amount=${amt} ${FIAT} (locked)`);
  }
  const m = (q.get('method') || '').toUpperCase();
  if (m === 'CARD' || m === 'BANK_TRANSFER') {
    state.method = m;
    state.methodLocked = true;
    log('info', `Param: method=${m} (locked)`);
  }
}

let statusTimer: ReturnType<typeof setTimeout> | null = null;
let coinageTimer: ReturnType<typeof setTimeout> | null = null;

async function init() {
  log('step', 'Boot — reading launch params + checking backend + loading regions');
  readParams();
  try {
    const h = await onrampApi.health();
    state.mode = h.mode;
    state.countries = await onrampApi.regions();
    log('info', `Ready · mode=${state.mode} · ${state.countries.length} regions`);
  } catch (e) {
    state.error = (e as Error).message;
  }
}

async function pickCountry(c: Country) {
  state.country = c.countryCode;
  state.fiat = FIAT;
  state.availability = null;
  // method may already be locked from the URL — skip its screen if so
  state.step = state.methodLocked && state.method ? 'amount' : 'method';
  log('step', `Region: ${c.name} (${c.countryCode}) · fiat ${state.fiat} — fetching routes`);
  try {
    state.availability = await onrampApi.routes(state.country, state.fiat, state.token);
  } catch {
    /* availability is best-effort; the quote is authoritative */
  }
}

function pickMethod(m: Method) {
  state.method = m;
  state.step = 'amount';
  log('step', `Method: ${m}`);
}

async function getQuote() {
  state.error = '';
  state.loading = true;
  state.quote = null;
  log('step', `Quote: forward — spend ${state.amount} ${state.fiat} ${state.method} → receive ${state.token}`);
  try {
    const q = await onrampApi.quote({
      amount: Number(state.amount),
      fiat: state.fiat,
      token: state.token,
      country: state.country,
      method: state.method as Method,
    });
    if ((q as QuoteResult).unavailable) state.error = 'No provider offers this method in this region — try another method.';
    else state.quote = q;
  } catch (e) {
    state.error = (e as Error).message;
  } finally {
    state.loading = false;
  }
}

async function startPay() {
  if (!state.quote) return;
  state.error = '';
  state.loading = true;
  try {
    // 1. coinage session -> per-session ephemeral Asset Hub deposit address
    log('step', 'Pay: opening coinage session → minting per-session ephemeral Asset Hub address');
    state.coinage = await coinageApi.create(state.quote.receiveAmount, state.quote.targetToken);
    log('info', `Ephemeral deposit address: ${state.coinage.ephemeralAddress}`);
    // 2. Meld session bound to that address (locked)
    log('step', 'Creating Meld session (walletAddress + cryptoCurrency locked)');
    state.session = await onrampApi.session({ quote: state.quote, walletAddress: state.coinage.ephemeralAddress });
    state.step = 'pay';
  } catch (e) {
    state.error = (e as Error).message;
  } finally {
    state.loading = false;
  }
}

/** Poll Meld payment status until SETTLED, then hand off to coinage. */
function simulatePayment() {
  if (statusTimer) clearTimeout(statusTimer);
  log('step', 'Payment submitted — polling Meld status until SETTLED');
  const tick = async () => {
    if (!state.session) return;
    try {
      const s = await onrampApi.status(state.session.sessionId);
      if (String(s.status).toUpperCase() === 'SETTLED') {
        log('info', 'Payment SETTLED — native DOT en route to ephemeral address');
        return onPaymentSettled();
      }
    } catch (e) {
      state.error = (e as Error).message;
    }
    statusTimer = setTimeout(tick, 1500);
  };
  void tick();
}

async function onPaymentSettled() {
  if (!state.coinage) return;
  state.step = 'coinage';
  log('step', 'Coinage handoff: deposit → swap → XCM → topUp — polling phase');
  await coinageApi.deliver(state.coinage.id); // native DOT "landed" on the ephemeral address
  pollCoinage();
}

function pollCoinage() {
  if (coinageTimer) clearTimeout(coinageTimer);
  let lastPhase = '';
  const tick = async () => {
    if (!state.coinage) return;
    try {
      state.coinage = await coinageApi.get(state.coinage.id);
      if (state.coinage.phase !== lastPhase) {
        lastPhase = state.coinage.phase;
        log('info', `Coinage phase: ${lastPhase}`);
      }
      if (state.coinage.phase === 'done') {
        state.step = 'done';
        log('info', `Done — ${state.coinage.coinageCredited ?? state.coinage.target} CASH credited as coinage`);
        return;
      }
    } catch (e) {
      state.error = (e as Error).message;
    }
    coinageTimer = setTimeout(tick, 1200);
  };
  void tick();
}

function reset() {
  if (statusTimer) clearTimeout(statusTimer);
  if (coinageTimer) clearTimeout(coinageTimer);
  state.step = 'region';
  state.method = '';
  state.quote = null;
  state.session = null;
  state.coinage = null;
  state.error = '';
}

export function useOnramp() {
  return { state, init, pickCountry, pickMethod, getQuote, startPay, simulatePayment, reset };
}
