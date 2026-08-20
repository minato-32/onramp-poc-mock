// Minimal country -> default fiat for the PoC. Production reads the fiat list from
// Meld's supported/currencies endpoint per country.
const MAP: Record<string, string> = {
  BR: 'BRL', MX: 'MXN', AR: 'ARS', CO: 'COP', CL: 'CLP', PE: 'PEN',
  US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD',
  DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', PT: 'EUR', NL: 'EUR',
  IN: 'INR', NG: 'NGN', KE: 'KES', ZA: 'ZAR', ID: 'IDR', PH: 'PHP', VN: 'VND', AE: 'AED', TR: 'TRY',
};

export function fiatFor(country: string): string {
  return MAP[country] ?? 'USD';
}
