/**
 * Shared configuration defaults (Task #172).
 *
 * Single source of truth for the fallback values used when the
 * corresponding environment variables are not set. Both the consumers
 * (openai-client, email-notifications, chargeNotifications) and the
 * boot-time configuration checker (startup-checks) import from here so
 * the boot log can never drift from what the running code actually uses.
 */

export const DEFAULT_SITE_URL = 'https://earmuffsgemach.com';
export const DEFAULT_DRAFT_MODEL = 'gpt-4o';
export const DEFAULT_EMBED_MODEL = 'text-embedding-3-small';
export const DEFAULT_ADMIN_EMAIL = 'admin@gemach.com';
