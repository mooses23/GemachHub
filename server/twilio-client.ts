/**
 * Twilio SMS client for sending return-reminder texts to borrowers.
 *
 * Activation is environment-driven: SMS is only available when ALL of
 * `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`
 * are set. Anything else (missing secret, malformed phone) reports
 * "not configured" rather than throwing at import time, so the
 * email-only path keeps working unchanged when SMS isn't enabled yet.
 */

import twilio, { type Twilio } from 'twilio';

export interface TwilioConfigStatus {
  configured: boolean;
  reason?: string;
}

let cachedClient: Twilio | null = null;
let cachedConfigKey = '';

function configKey(): string {
  return [
    process.env.TWILIO_ACCOUNT_SID || '',
    process.env.TWILIO_AUTH_TOKEN || '',
    process.env.TWILIO_FROM_NUMBER || '',
  ].join('|');
}

export function getTwilioConfigStatus(): TwilioConfigStatus {
  const sid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const from = (process.env.TWILIO_FROM_NUMBER || '').trim();
  if (!sid || !token || !from) {
    return {
      configured: false,
      reason: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER to enable SMS reminders.',
    };
  }
  if (!sid.startsWith('AC')) {
    return { configured: false, reason: 'TWILIO_ACCOUNT_SID must start with "AC".' };
  }
  return { configured: true };
}

function getClient(): Twilio {
  const key = configKey();
  if (cachedClient && key === cachedConfigKey) return cachedClient;
  // Re-initialize when env changes (mostly for tests); twilio() is cheap
  // but we cache between requests to avoid the overhead in hot paths.
  cachedClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  cachedConfigKey = key;
  return cachedClient;
}

// Strip everything except digits and a leading "+", which is what Twilio's
// /Messages endpoint accepts. Returns null if the result is too short to be
// a real number (so callers can fail loudly with a clear message).
export function normalizePhoneForSms(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7) return null;
  return (hasPlus ? '+' : '') + digits;
}

export interface ReturnReminderSmsContext {
  borrowerName: string;
  borrowerPhone: string;
  locationName: string;
  language: 'en' | 'he';
  /** Public status-page URL the borrower can open to see the loan. Optional. */
  statusUrl?: string;
}

// Pure helper — exported for tests. Builds the bilingual SMS body for a
// return reminder. Kept short (under ~320 chars / 2 SMS segments) to
// avoid surprise carrier charges and to read well on the lock screen.
export function buildReturnReminderSmsBody(ctx: ReturnReminderSmsContext): string {
  const firstName = (ctx.borrowerName || '').trim().split(/\s+/)[0] || ctx.borrowerName || '';
  const tail = ctx.statusUrl ? `\n${ctx.statusUrl}` : '';
  if (ctx.language === 'he') {
    return `שלום ${firstName}, תזכורת ידידותית מגמ"ח אוזניות בייבי בנז ${ctx.locationName} — נשמח אם תחזיר את האוזניות כדי שמשפחה נוספת תוכל ליהנות מהן. אם כבר החזרת, אפשר להתעלם.${tail}`;
  }
  return `Hi ${firstName}, friendly reminder from the ${ctx.locationName} Baby Banz Earmuffs Gemach — please bring back the earmuffs when you can so the next family can use them. If you've already returned them, ignore this note.${tail}`;
}

/**
 * Sends a return-reminder SMS via Twilio.
 *
 * Throws when:
 * - Twilio is not configured (caller should check `getTwilioConfigStatus()` first).
 * - The phone number is unusable after normalization.
 * - Twilio's API rejects the request (network, invalid number, suspended account, etc.).
 *
 * Errors carry a human-readable `message` suitable for surfacing in the
 * operator UI; we intentionally do NOT include any Twilio internals.
 */
export async function sendReturnReminderSMS(ctx: ReturnReminderSmsContext): Promise<{ sid: string }> {
  const status = getTwilioConfigStatus();
  if (!status.configured) {
    throw new Error(status.reason || 'SMS is not configured.');
  }
  const to = normalizePhoneForSms(ctx.borrowerPhone);
  if (!to) {
    throw new Error('Borrower phone number is missing or too short to send SMS.');
  }
  const body = buildReturnReminderSmsBody({ ...ctx, borrowerPhone: to });
  const client = getClient();
  try {
    const msg = await client.messages.create({
      to,
      from: process.env.TWILIO_FROM_NUMBER!,
      body,
    });
    return { sid: msg.sid };
  } catch (e: any) {
    // Twilio errors include `code` and `moreInfo`; surface a short reason.
    const reason = e?.message || 'Twilio rejected the SMS request.';
    throw new Error(`SMS send failed: ${reason}`);
  }
}
