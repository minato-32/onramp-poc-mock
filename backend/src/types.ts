export type Method = 'CARD' | 'BANK_TRANSFER';

export interface QuoteInput {
  amount: number; // fiat the user spends (source) — USD in this PoC
  fiat: string; // always 'USD' in this PoC
  token: string; // e.g. DOT_ASSETHUB
  country: string;
  method: Method;
}

export interface QuoteResult {
  charge: number; // fiat sourceAmount charged (= amount)
  fiat: string;
  targetToken: string;
  receiveAmount: number; // est. token delivered (destinationAmount) — varies with rate
  country: string;
  method: Method;
  serviceProvider: string;
  mock: boolean;
  breakdown: {
    sourceAmount: number;
    sourceAmountWithoutFees: number;
    totalFee: number;
    transactionFee: number;
    networkFee: number;
    exchangeRate: number;
    destinationAmount: number;
  };
  providers: Array<{ serviceProvider: string; sourceAmount: number; destinationAmount: number; totalFee: number }>;
}

export interface SessionResult {
  sessionId: string;
  serviceProviderWidgetUrl: string; // provider hosted page — open in an in-app WebView
  mock: boolean;
}

// --- Coinage handoff (mock; models getsome tb/coinage-handoff) ---
export type CoinagePhase =
  | 'idle'
  | 'awaiting-deposit' // ephemeral address issued, waiting for native DOT
  | 'swapping' // pool swap DOT -> CASH on Asset Hub
  | 'moving' // XCM CASH -> People chain
  | 'topping-up' // host topUp() -> coinage
  | 'done'
  | 'error';

export interface CoinageSession {
  id: string;
  ephemeralAddress: string; // per-session deposit address (privacy-preserving)
  target: number;
  token: string;
  phase: CoinagePhase;
  coinageCredited?: number;
  error?: string;
}
