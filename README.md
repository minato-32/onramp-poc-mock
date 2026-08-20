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

## Notes
- **No widget / no runtime redirect URL** — Meld is used strictly via its API.
- Fiat is fixed to **USD** in this PoC (no per-country fiat mapping yet).
- Meld key stays **server-side only**; never on the frontend; never commit `.env`.
- Default token is **`DOT_ASSETHUB`** (host ingests native DOT); USDC/USDT would need a swap-to-DOT
  leg before the coinage handoff.
