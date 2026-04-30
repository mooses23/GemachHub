/**
 * Startup configuration checks (Task #161).
 *
 * Validates environment variables at boot time and produces a single,
 * easy-to-scan report. The goals are:
 *
 *   1. Hard-fail (throw) on truly required vars so misconfigured deployments
 *      crash loudly instead of "succeeding" then misbehaving silently.
 *   2. Print loud WARNING lines for vars that are required in production
 *      (payments, AI drafting, public URLs) so a deploy without them is
 *      obvious in the logs.
 *   3. Print debug lines noting which fallback default is being used for
 *      optional vars (model names, SITE_URL, ADMIN_EMAIL) so an operator
 *      reading the logs can tell whether the running config is the one
 *      they expected.
 *   4. Print a one-line status for optional integrations (Twilio SMS /
 *      WhatsApp, Gmail) so it's obvious from boot logs which features are
 *      enabled.
 *
 * Call `runStartupChecks()` once, as early as possible, from server/index.ts.
 */

import { log } from './vite.js';
import { getTwilioConfigStatus, getTwilioWhatsAppConfigStatus } from './twilio-client.js';
import { getGmailConfigStatus } from './gmail-client.js';
import {
  DEFAULT_SITE_URL,
  DEFAULT_DRAFT_MODEL,
  DEFAULT_EMBED_MODEL,
  DEFAULT_ADMIN_EMAIL,
} from './config-defaults.js';

export interface StartupCheckResult {
  errors: string[];
  warnings: string[];
  notices: string[];
}

/**
 * Pure validator. Returns the lists of errors / warnings / notices without
 * logging or throwing, so it can also be exercised from a unit test.
 */
export function collectStartupCheckMessages(env: NodeJS.ProcessEnv = process.env): StartupCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const notices: string[] = [];

  const isSet = (name: string): boolean => {
    const v = env[name];
    return typeof v === 'string' && v.trim().length > 0;
  };

  const isProduction = env.NODE_ENV === 'production';

  // ---- Always required ----------------------------------------------------
  if (!isSet('DATABASE_URL')) {
    errors.push('DATABASE_URL is not set. The app cannot connect to PostgreSQL.');
  }

  // ---- Required in production --------------------------------------------
  if (!isSet('SESSION_SECRET')) {
    if (isProduction) {
      errors.push('SESSION_SECRET is not set. Required in production for signed session cookies.');
    } else {
      notices.push('SESSION_SECRET not set; falling back to the dev-only secret. Do not use this in production.');
    }
  }

  // Public base URL — used to build links in welcome SMS / WhatsApp / email.
  if (!isSet('APP_URL') && !isSet('SITE_URL')) {
    if (isProduction) {
      warnings.push('Neither APP_URL nor SITE_URL is set. Operator welcome links and SMS reminders will fall back to the request host or a hardcoded default and may point at the wrong domain.');
    } else {
      notices.push('Neither APP_URL nor SITE_URL is set; falling back to per-request host in dev.');
    }
  }

  // Stripe — payments are unusable without these.
  if (!isSet('STRIPE_SECRET_KEY')) {
    (isProduction ? errors : warnings).push('STRIPE_SECRET_KEY is not set. Stripe charges, refunds, and SetupIntents will fail.');
  }
  if (!isSet('STRIPE_PUBLISHABLE_KEY') && !isSet('VITE_STRIPE_PUBLISHABLE_KEY')) {
    (isProduction ? errors : warnings).push('STRIPE_PUBLISHABLE_KEY (or VITE_STRIPE_PUBLISHABLE_KEY) is not set. The Stripe payment form on the client will not load.');
  }
  if (!isSet('STRIPE_WEBHOOK_SECRET')) {
    (isProduction ? errors : warnings).push('STRIPE_WEBHOOK_SECRET is not set. Stripe webhook signature verification will reject every event.');
  }

  // OpenAI — AI drafting falls back to a static reply without it.
  if (!isSet('OPENAI_API_KEY')) {
    if (isProduction) {
      warnings.push('OPENAI_API_KEY is not set. AI-drafted email replies will fall back to a generic message and embeddings will be skipped.');
    } else {
      notices.push('OPENAI_API_KEY is not set; AI drafting falls back to a generic reply.');
    }
  }

  // ---- Optional vars with documented defaults (debug-style notices) -------
  if (!isSet('SITE_URL')) {
    notices.push(`SITE_URL not set; using default "${DEFAULT_SITE_URL}" in playbook URLs.`);
  }
  if (!isSet('OPENAI_DRAFT_MODEL')) {
    notices.push(`OPENAI_DRAFT_MODEL not set; using default "${DEFAULT_DRAFT_MODEL}".`);
  }
  if (!isSet('OPENAI_EMBED_MODEL')) {
    notices.push(`OPENAI_EMBED_MODEL not set; using default "${DEFAULT_EMBED_MODEL}".`);
  }
  if (!isSet('ADMIN_EMAIL') && !isSet('GMAIL_USER')) {
    notices.push(`ADMIN_EMAIL / GMAIL_USER not set; admin notifications fall back to "${DEFAULT_ADMIN_EMAIL}".`);
  }

  return { errors, warnings, notices };
}

/**
 * Runs the env-var validator and logs a single startup report, plus the
 * status of the optional integrations (Twilio, Gmail). Throws if any
 * truly-required vars are missing so the process fails fast at boot.
 */
export async function runStartupChecks(): Promise<void> {
  const { errors, warnings, notices } = collectStartupCheckMessages();

  for (const note of notices) {
    log(`config: ${note}`);
  }
  for (const warning of warnings) {
    log(`config WARNING: ${warning}`);
  }

  // Optional integration status — informational, never fatal.
  const sms = getTwilioConfigStatus();
  if (sms.configured) {
    log('config: Twilio SMS configured.');
  } else {
    log(`config: Twilio SMS disabled — ${sms.reason}`);
  }

  const wa = getTwilioWhatsAppConfigStatus();
  if (wa.configured) {
    log('config: Twilio WhatsApp configured.');
  } else {
    log(`config: Twilio WhatsApp disabled — ${wa.reason}`);
  }

  try {
    const gmail = await getGmailConfigStatus();
    if (gmail.configured) {
      log(`config: Gmail configured (${gmail.environment}) — ${gmail.message}`);
    } else {
      log(`config: Gmail not configured (${gmail.environment}) — ${gmail.message}`);
    }
  } catch (err: any) {
    log(`config: Gmail status check failed — ${err?.message ?? err}`);
  }

  if (errors.length > 0) {
    const summary = errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n');
    throw new Error(
      `Startup configuration check failed. Missing required environment variables:\n${summary}\n` +
      'Set these in the deployment environment and restart.',
    );
  }
}
