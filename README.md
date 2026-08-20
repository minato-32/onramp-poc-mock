# On-Ramp PoC (mock)

A standalone proof-of-concept for the **card / bank-transfer on-ramp** via **Meld's
white-label API** (custom UI, no widget/redirect), integrated with a **mock coinage handoff**.

The user enters a **fiat amount to spend** (USD); Meld returns the token they receive (forward
quote), delivers **native DOT** to a **per-session ephemeral Asset Hub address**, and the host
converts it to **coinage** (swap → CASH → People → `topUp()`). The coinage side is a **mock**
here, modelled on the getsome `tb/coinage-handoff` interface; it swaps to the real `@onramp/*`
packages once shared.

The spend amount and pay method can be supplied via **query params** for a host-launched flow:
`?amount=100&method=CARD` (any missing param falls back to its in-app screen).

## Runs fully locally — with or without a Meld key
- **No key (default):** a built-in **mock mode** returns realistic quotes / sessions / statuses so
  the whole flow is demoable end-to-end with zero external dependencies.
- **With a sandbox key:** set `MELD_API_KEY` and it calls the real Meld API.

## Layout (industry structure)
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

## Flow
region → method (bank / card) → spend amount (USD) → quote (forward: spend → receive ≈ token) →
in-app pay (WebView) → status → **coinage handoff** (ephemeral address → deliver DOT → swap → CASH
→ People → topUp → coinage). A live **activity log** panel traces every API call, step, and result.
All mock-driven until the Meld key + `@onramp/*` packages are wired.

## Notes
- **No widget / no runtime redirect URL** — Meld is used strictly via its API.
- Fiat is fixed to **USD** in this PoC (no per-country fiat mapping yet).
- Meld key stays **server-side only**; never on the frontend; never commit `.env`.
- Default token is **`DOT_ASSETHUB`** (host ingests native DOT); USDC/USDT would need a swap-to-DOT
  leg before the coinage handoff.
