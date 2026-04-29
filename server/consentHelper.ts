/**
 * Canonical consent sentence for card-on-file authorisation.
 * The server builds this from stored data at both display time
 * (/api/status, /api/deposits/fee-quote) and save time
 * (/api/deposits/setup-intent, /api/deposits/confirm-setup), so the
 * audit-trail text is always byte-identical to what the borrower saw.
 *
 * @param gemachName  Display name of the gemach location.
 * @param maxChargeCents  Maximum authorised charge in cents (deposit + fee).
 */
export function buildCanonicalConsentText(gemachName: string, maxChargeCents: number): string {
  const dollars = (maxChargeCents / 100).toFixed(2);
  return `By saving this card, I authorize ${gemachName} to charge up to $${dollars} if I do not return the borrowed item.`;
}
