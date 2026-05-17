// Task #309: Phone resolution helper. Given a normalized E.164 phone number,
// look it up against (a) transactions.borrowerPhone — the borrower who took
// out a deposit — and (b) locations.phone — the operator/gemach line. The
// result is cached onto sms_conversations.displayName by callers so we don't
// re-query on every inbox render.
//
// Resolution rules (first match wins):
//   1. Borrower match — most recent transaction whose normalized phone equals
//      the inbound number. Returns the borrower's name; locationId is taken
//      from that transaction so the conversation lands on the right gemach.
//   2. Operator/location match — location whose normalized phone equals the
//      inbound number. Returns the location.name and that location's id.
//   3. No match — both fields null; UI shows the raw phone and surfaces the
//      conversation under the "Unknown" filter chip so admins can triage.
//
// We deliberately do NOT fall back to looser substring matches: a wrong auto-
// assignment is worse than no assignment because operators will see a stranger
// attributed to their gemach. Admins can always assign manually from the UI.

import type { IStorage } from "./storage.js";
import { normalizePhoneForSms } from "../shared/phone.js";

export type PhoneOwnerKind = "borrower" | "operator" | null;

export interface ResolvedPhoneOwner {
  displayName: string | null;
  locationId: number | null;
  kind: PhoneOwnerKind;
}

export async function resolvePhoneOwner(
  rawPhone: string,
  storage: IStorage,
): Promise<ResolvedPhoneOwner> {
  const normalized = normalizePhoneForSms(rawPhone) || rawPhone;
  if (!normalized) return { displayName: null, locationId: null, kind: null };

  // 1) Borrower lookup — scan transactions for matching phone. We normalize
  //    both sides so stored numbers like "(555) 123-4567" still match an
  //    inbound E.164 "+15551234567". Newest transaction wins so a borrower
  //    who has used multiple gemachs lands on their most recent one.
  try {
    const txs = await storage.getAllTransactions();
    const matches = txs.filter((t) => {
      if (!t.borrowerPhone) return false;
      const txNorm = normalizePhoneForSms(t.borrowerPhone);
      return !!txNorm && txNorm === normalized;
    });
    if (matches.length) {
      matches.sort((a, b) => {
        const ad = a.borrowDate ? new Date(a.borrowDate).getTime() : 0;
        const bd = b.borrowDate ? new Date(b.borrowDate).getTime() : 0;
        return bd - ad;
      });
      const top = matches[0];
      if (top.borrowerName?.trim()) {
        return {
          displayName: top.borrowerName.trim(),
          locationId: top.locationId ?? null,
          kind: "borrower",
        };
      }
    }
  } catch (e: any) {
    console.warn("[sms-resolver] borrower lookup failed:", e?.message);
  }

  // 2) Operator/location lookup — the inbound number is one of our gemach
  //    operator lines (e.g. the operator themselves replied from their cell).
  try {
    const locations = await storage.getAllLocations();
    const match = locations.find((l) => {
      const lp = normalizePhoneForSms(l.phone || "");
      return !!lp && lp === normalized;
    });
    if (match && match.name?.trim()) {
      return {
        displayName: match.name.trim(),
        locationId: match.id,
        kind: "operator",
      };
    }
  } catch (e: any) {
    console.warn("[sms-resolver] operator lookup failed:", e?.message);
  }

  return { displayName: null, locationId: null, kind: null };
}
