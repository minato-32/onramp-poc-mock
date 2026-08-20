import { config } from '../config.js';
import type { Method } from '../types.js';

/**
 * Stage A — target final token T -> dest crypto to buy (D_buy), over-estimated so
 * the user never under-receives:
 *   D_req = T * R_conv * (1 + b_host) + G_host + ED
 *   D_buy = D_req * (1 + b_slip)   (b_slip higher for BANK_TRANSFER)
 * Buffers are host/config constants; the frontend never sees them.
 */
export function computeDepositAmount(target: number, method: Method): number {
  const b = config.buffers;
  const dReq = target * b.convRate * (1 + b.convBuffer) + b.gasReserve + b.existential;
  const slip = method === 'BANK_TRANSFER' ? b.slippageBank : b.slippageCard;
  return dReq * (1 + slip);
}
