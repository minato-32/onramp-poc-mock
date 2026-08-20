// Asset Hub destination currency codes (Meld live catalog, chainCode ASSETHUB).
// DOT first: the host coinage flow ingests native DOT (`sourceId: "dot-assethub"`);
// USDC/USDT would each need a swap-to-DOT before the coinage handoff.
export const TARGET_TOKENS = [
  { label: 'DOT · Asset Hub (native — host-ready)', code: 'DOT_ASSETHUB' },
  { label: 'USDC · Asset Hub (needs USDC→DOT swap)', code: 'USDC_ASSETHUB' },
  { label: 'USDT · Asset Hub (needs USDT→DOT swap)', code: 'USDT_ASSETHUB' },
];
