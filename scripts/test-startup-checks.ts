/**
 * Regression test for the startup configuration checker (Task #161).
 *
 * Exercises `collectStartupCheckMessages` with a few representative env
 * shapes and asserts the right errors / warnings / notices come out.
 *
 * Run with: `npx tsx scripts/test-startup-checks.ts`
 */

import { collectStartupCheckMessages } from '../server/startup-checks.js';

let failed = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error('FAIL:', msg);
    failed++;
  } else {
    console.log('OK:', msg);
  }
}

// Case 1: production with everything missing — required vars are hard errors.
{
  const r = collectStartupCheckMessages({ NODE_ENV: 'production' } as NodeJS.ProcessEnv);
  assert(r.errors.some(e => e.includes('DATABASE_URL')), 'prod: DATABASE_URL missing → error');
  assert(r.errors.some(e => e.includes('SESSION_SECRET')), 'prod: SESSION_SECRET missing → error');
  assert(r.errors.some(e => e.includes('STRIPE_SECRET_KEY')), 'prod: STRIPE_SECRET_KEY missing → error');
  assert(r.errors.some(e => e.includes('STRIPE_WEBHOOK_SECRET')), 'prod: STRIPE_WEBHOOK_SECRET missing → error');
  assert(r.warnings.some(w => w.includes('OPENAI_API_KEY')), 'prod: OPENAI_API_KEY missing → warning');
  assert(r.warnings.some(w => w.includes('APP_URL') || w.includes('SITE_URL')), 'prod: APP_URL/SITE_URL missing → warning');
  assert(r.notices.some(n => n.includes('OPENAI_DRAFT_MODEL')), 'prod: notice when default OPENAI_DRAFT_MODEL is in use');
  assert(r.notices.some(n => n.includes('OPENAI_EMBED_MODEL')), 'prod: notice when default OPENAI_EMBED_MODEL is in use');
}

// Case 2: development with everything missing — only DATABASE_URL is fatal.
{
  const r = collectStartupCheckMessages({ NODE_ENV: 'development' } as NodeJS.ProcessEnv);
  assert(r.errors.some(e => e.includes('DATABASE_URL')), 'dev: DATABASE_URL still required');
  assert(!r.errors.some(e => e.includes('SESSION_SECRET')), 'dev: SESSION_SECRET is not a hard error');
  assert(!r.errors.some(e => e.includes('STRIPE_SECRET_KEY')), 'dev: STRIPE_SECRET_KEY is not a hard error');
  assert(r.notices.some(n => n.includes('SESSION_SECRET')), 'dev: SESSION_SECRET fallback noted');
}

// Case 3: production with everything set — no errors, warnings, or fallback notices.
{
  const r = collectStartupCheckMessages({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://x',
    SESSION_SECRET: 'long-secret',
    APP_URL: 'https://app.example',
    SITE_URL: 'https://site.example',
    STRIPE_SECRET_KEY: 'sk_test_x',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_x',
    STRIPE_WEBHOOK_SECRET: 'whsec_x',
    OPENAI_API_KEY: 'sk-x',
    OPENAI_DRAFT_MODEL: 'gpt-4o',
    OPENAI_EMBED_MODEL: 'text-embedding-3-small',
    ADMIN_EMAIL: 'admin@example.com',
  } as NodeJS.ProcessEnv);
  assert(r.errors.length === 0, `prod fully set: 0 errors (got ${r.errors.length})`);
  assert(r.warnings.length === 0, `prod fully set: 0 warnings (got ${r.warnings.length})`);
  assert(r.notices.length === 0, `prod fully set: 0 fallback notices (got ${JSON.stringify(r.notices)})`);
}

// Case 4: VITE_STRIPE_PUBLISHABLE_KEY satisfies the publishable-key requirement.
{
  const r = collectStartupCheckMessages({
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://x',
    SESSION_SECRET: 's',
    APP_URL: 'https://x',
    SITE_URL: 'https://x',
    STRIPE_SECRET_KEY: 'sk',
    VITE_STRIPE_PUBLISHABLE_KEY: 'pk',
    STRIPE_WEBHOOK_SECRET: 'whsec',
    OPENAI_API_KEY: 'k',
    OPENAI_DRAFT_MODEL: 'gpt-4o',
    OPENAI_EMBED_MODEL: 'text-embedding-3-small',
    ADMIN_EMAIL: 'a@b.c',
  } as NodeJS.ProcessEnv);
  assert(
    !r.errors.some(e => e.includes('STRIPE_PUBLISHABLE_KEY')),
    'VITE_STRIPE_PUBLISHABLE_KEY satisfies the publishable-key check',
  );
}

// Case 5: whitespace / empty strings count as "not set".
{
  const r = collectStartupCheckMessages({
    NODE_ENV: 'production',
    DATABASE_URL: '   ',
    SESSION_SECRET: '',
  } as NodeJS.ProcessEnv);
  assert(r.errors.some(e => e.includes('DATABASE_URL')), 'whitespace DATABASE_URL → error');
  assert(r.errors.some(e => e.includes('SESSION_SECRET')), 'empty SESSION_SECRET → error');
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log('\nAll startup-check tests passed.');
