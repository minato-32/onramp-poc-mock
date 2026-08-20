# On-Ramp PoC (mock)

A standalone proof-of-concept for the **card / bank-transfer on-ramp** via **Meld's
white-label API** (custom UI, no widget/redirect), integrated with a **mock coinage handoff**.

The user enters a **fiat amount to spend** (USD); Meld returns the token they receive (forward
quote), delivers **native DOT** to a **per-session ephemeral Asset Hub address**, and the host
converts it to **coinage** (swap → CASH → People → `topUp()`). The coinage side is a **mock**
here; it swaps to the real host coinage flow when that is wired in.

The spend amount and pay method can be supplied via **query params** for a host-launched flow —
see [Query params](#query-params) below.

## Runs fully locally — with or without a Meld key
- **No key (default):** a built-in **mock mode** returns quotes / sessions / statuses so the whole
  flow runs end-to-end with zero external dependencies.
- **With a sandbox key:** set `MELD_API_KEY` and it calls the real Meld API.

## Layout
```
onramp-poc-mock/
├── backend/   Node + Express — Meld service (real + mock), deposit-math, coinage mock
│   └── src/ config · types · services/ · utils/ · routes/ · index
└── frontend/  Vue 3 + Vite — custom UI
    └── src/ services/ · utils/ · composables/ · components/ · App.vue
```

## Run
```bash
cd backend  && npm install && cp .env.example .env   # MELD_API_KEY optional (mock mode without it)
npm run dev                                           # http://localhost:8787
cd ../frontend && npm install && npm run dev          # http://localhost:5173
```

## Query params
Prefill / pre-lock steps by adding params to the URL. Anything you omit just shows its normal
in-app screen, so a plain `http://localhost:5173/` still runs the full manual flow.

| Param    | Allowed values                    | Effect                                                        |
|----------|-----------------------------------|--------------------------------------------------------------|
| `amount` | any positive number (USD)         | Pre-fills the spend amount and **locks** the input           |
| `method` | `CARD` or `BANK_TRANSFER`         | Pre-selects the pay method and **skips** the method screen    |

Case-insensitive; an invalid value is ignored and the screen shows instead.

**Copy-paste examples** (change the values):
```
http://localhost:5173/?amount=100&method=CARD
http://localhost:5173/?amount=250&method=BANK_TRANSFER
http://localhost:5173/?amount=50
http://localhost:5173/?method=CARD
```

## Flow
region → method (bank / card) → spend amount (USD) → quote (forward: spend → receive ≈ token) →
in-app pay (WebView) → status → **coinage handoff** (ephemeral address → deliver DOT → swap → CASH
→ People → topUp → coinage). A live **activity log** panel traces every API call, step, and result.
All mock-driven until the Meld key and the real coinage flow are wired.

## APIs

### External services
Three third-party services are called. In **mock mode** only the keyless ones are hit — Meld's
authenticated quote/session/status are served locally instead.

**Meld — public discovery** · base `https://api.meld.io` · no key · called in **both** modes
| Method & path | Purpose |
|---|---|
| `GET /network-partner/supported/countries?category=CRYPTO_ONRAMP` | Regions / countries |
| `GET /network-partner/supported/payment-methods?category=CRYPTO_ONRAMP&country=XX` | Payment-method catalog |
| `GET /network-partner/supported/routes/CRYPTO_ONRAMP/{country}/{fiat}/{token}` | Route availability |

**Meld — authenticated** · base `https://api-sb.meld.io` (sandbox) / `https://api.meld.io` (prod) ·
needs `MELD_API_KEY` (`Authorization: BASIC <key>` + `Meld-Version`) · **live mode only**
| Method & path | Purpose |
|---|---|
| `POST /payments/crypto/quote` | Forward quote (spend → receive) |
| `POST /crypto/session/widget` | Create BUY session (returns widget URL) |
| `GET /payments/transactions/{id}` | Payment status |

**FX rates** · `GET https://open.er-api.com/v6/latest/USD` · no key · always live · 10-min cache
Live USD → local-currency rates for the amount-step conversion panel.

### Backend API (frontend → our Express server)
Mounted at `/api/onramp` and `/api/coinage`. The Meld key never leaves the backend.

`/api/onramp`
| Method & path | Purpose |
|---|---|
| `GET /health` | Mode (mock/live) + Meld env |
| `GET /regions` | Countries (proxies Meld public; offline fallback) |
| `GET /methods?country=XX` | Payment methods (proxies Meld public) |
| `GET /routes?country=&fiat=&token=` | Parsed route availability |
| `GET /fx?from=USD&to=XXX` | Live FX rate |
| `POST /quote` | Forward quote (real Meld, else mock) |
| `POST /session` | Create pay session (real Meld, else mock) |
| `GET /status/:id` | Payment status (real Meld, else mock) |

`/api/coinage` — mock coinage handoff, in-memory
| Method & path | Purpose |
|---|---|
| `POST /session` | Open coinage session → mints ephemeral Asset Hub address |
| `POST /deliver/:id` | Simulate the native-DOT deposit landing → start advancing |
| `GET /:id` | Poll the handoff phase (awaiting-deposit → … → done) |

## Notes
- **No widget / no runtime redirect URL** — Meld is used strictly via its API.
- Fiat is fixed to **USD** in this PoC (no per-country fiat mapping yet).
- Meld key stays **server-side only**; never on the frontend; never commit `.env`.
- Default token is **`DOT_ASSETHUB`** (host ingests native DOT); USDC/USDT would need a swap-to-DOT
  leg before the coinage handoff.
