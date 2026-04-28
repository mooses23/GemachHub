// Task #39: single source of truth for processing-fee math.
//
// Stripe charges (us-style cards): 2.9% + $0.30 per successful charge.
// Historically only the percent was added on top of the deposit, which
// quietly cost the gemach money on every transaction (especially small
// deposits where the fixed $0.30 dwarfs the percent). This helper adds
// both, then ceils to whole cents so the gemach is always made whole.

export interface ComputeFeeInput {
  /** Deposit amount in CENTS. */
  depositCents: number;
  /** Processing fee percent in BASIS POINTS. e.g. 290 = 2.9%, 300 = 3.0%. */
  percentBp: number;
  /** Fixed per-transaction fee in CENTS. e.g. 30 = $0.30. */
  fixedCents: number;
}

export interface ComputeFeeResult {
  feeCents: number;
  totalCents: number;
}

export function computeProcessingFeeCents(input: ComputeFeeInput): ComputeFeeResult {
  const deposit = Math.max(0, Math.round(input.depositCents));
  const pct = Math.max(0, Math.round(input.percentBp));
  const fixed = Math.max(0, Math.round(input.fixedCents));
  const feeCents = Math.ceil((deposit * pct) / 10000) + fixed;
  return { feeCents, totalCents: deposit + feeCents };
}

/**
 * Convenience helper that pulls the per-location fee config and computes
 * the fee for a given deposit amount in CENTS.
 */
export function computeFeeForLocation(
  depositCents: number,
  location: { processingFeePercent?: number | null; processingFeeFixed?: number | null } | null | undefined
): ComputeFeeResult {
  const percentBp = location?.processingFeePercent ?? 300;
  const fixedCents = location?.processingFeeFixed ?? 30;
  return computeProcessingFeeCents({ depositCents, percentBp, fixedCents });
}
