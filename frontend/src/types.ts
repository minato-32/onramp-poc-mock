export type Method = 'CARD' | 'BANK_TRANSFER';

export interface Country {
  countryCode: string;
  name: string;
  flag: string;
  subdivisions: Array<{ code?: string; name?: string }>;
}

export interface QuoteResult {
  charge: number;
  fiat: string;
  targetToken: string;
  receiveAmount: number;
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
  unavailable?: boolean;
}

export interface SessionResult {
  sessionId: string;
  serviceProviderWidgetUrl: string;
  mock: boolean;
}

export type CoinagePhase = 'idle' | 'awaiting-deposit' | 'swapping' | 'moving' | 'topping-up' | 'done' | 'error';

export interface CoinageSession {
  id: string;
  ephemeralAddress: string;
  target: number;
  token: string;
  phase: CoinagePhase;
  coinageCredited?: number;
  error?: string;
}

export interface RouteAvailability {
  available: boolean;
  methods: Array<{ type: string; min: number; max: number; currency: string; providers: string[] }>;
  providerCount: number;
}
