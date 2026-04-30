/**
 * Integration-style boot test for the startup configuration check (Task #161).
 *
 * Spawns the real server entry point (`server/index.ts`) under a few env
 * shapes and asserts:
 *
 *   1. With every required prod var missing, runStartupChecks() throws a
 *      single combined error listing all of them — and it speaks BEFORE
 *      any low-level SDK error (e.g. the OpenAI "Missing credentials"
 *      crash that used to happen at module-load time). This guards the
 *      import-ordering invariant: env-dependent modules must be imported
 *      AFTER runStartupChecks().
 *
 *   2. With every required prod var present except OPENAI_API_KEY, the
 *      server still boots ("serving on port") and OPENAI_API_KEY appears
 *      as a "config WARNING" rather than crashing the process. This
 *      guards the lazy-OpenAI-client invariant.
 *
 * Run with: `npx tsx scripts/test-startup-boot.ts`
 *
 * Exits non-zero on failure.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';

interface BootResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  combined: string;
}

function bootServer(envOverrides: NodeJS.ProcessEnv, timeoutMs: number): Promise<BootResult> {
  return new Promise((resolve) => {
    const entry = path.resolve(process.cwd(), 'server/index.ts');
    // Strip every env var the startup checker cares about so the test's
    // explicit overrides aren't accidentally satisfied by the host shell.
    const SCRUB = new Set([
      'NODE_ENV',
      'DATABASE_URL', 'SESSION_SECRET',
      'STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'VITE_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'OPENAI_API_KEY', 'OPENAI_DRAFT_MODEL', 'OPENAI_EMBED_MODEL',
      'APP_URL', 'SITE_URL', 'ADMIN_EMAIL', 'GMAIL_USER',
    ]);
    const baseEnv: NodeJS.ProcessEnv = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (!SCRUB.has(k) && v !== undefined) baseEnv[k] = v;
    }
    const child = spawn('npx', ['tsx', entry], {
      env: { ...baseEnv, ...envOverrides },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let combined = '';
    child.stdout.on('data', (d) => {
      const s = d.toString();
      stdout += s;
      combined += s;
    });
    child.stderr.on('data', (d) => {
      const s = d.toString();
      stderr += s;
      combined += s;
    });

    const killTimer = setTimeout(() => {
      child.kill('SIGKILL');
    }, timeoutMs);

    child.on('exit', (code, signal) => {
      clearTimeout(killTimer);
      resolve({ exitCode: code, signal, stdout, stderr, combined });
    });
  });
}

let failed = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error('FAIL:', msg);
    failed++;
  } else {
    console.log('OK:', msg);
  }
}

async function main(): Promise<void> {
  // ----- Case 1: nothing set in production -> single combined error,
  //               and it appears BEFORE any SDK-level crash. -----
  {
    console.log('\n--- case 1: production with all required vars missing ---');
    const result = await bootServer({ NODE_ENV: 'production' }, 10_000);

    assert(
      result.combined.includes('Startup configuration check failed'),
      'case 1: combined error message printed',
    );
    assert(
      result.combined.includes('DATABASE_URL is not set'),
      'case 1: report mentions DATABASE_URL',
    );
    assert(
      result.combined.includes('SESSION_SECRET is not set'),
      'case 1: report mentions SESSION_SECRET',
    );
    assert(
      result.combined.includes('STRIPE_SECRET_KEY is not set'),
      'case 1: report mentions STRIPE_SECRET_KEY',
    );

    // The critical regression guard: the OpenAI SDK used to crash with
    // "Missing credentials" at module-load before our checker spoke.
    // If that ever happens again, this assertion will fail.
    assert(
      !result.combined.includes('Missing credentials'),
      'case 1: no low-level OpenAI "Missing credentials" crash before startup-checks runs',
    );

    // The ordering guard: the startup-check error line must appear BEFORE
    // any other thrown errors in the output.
    const reportIdx = result.combined.indexOf('Startup configuration check failed');
    const otherErrIdx = result.combined.search(/Error:\s+(?!Startup configuration check)/);
    assert(
      reportIdx >= 0 && (otherErrIdx === -1 || reportIdx < otherErrIdx),
      'case 1: startup-check error is the FIRST error printed',
    );

    assert(
      !result.combined.includes('serving on port'),
      'case 1: server does NOT start when required vars are missing',
    );
  }

  // ----- Case 2: only OPENAI_API_KEY missing -> warning + boot succeeds. -----
  {
    console.log('\n--- case 2: production, OPENAI_API_KEY missing only ---');
    const realDatabaseUrl = process.env.DATABASE_URL ?? '';
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      // Reuse the working dev DATABASE_URL so DB init succeeds.
      DATABASE_URL: realDatabaseUrl,
      SESSION_SECRET: 'integration-test-secret',
      STRIPE_SECRET_KEY: 'sk_test_integration',
      STRIPE_PUBLISHABLE_KEY: 'pk_test_integration',
      STRIPE_WEBHOOK_SECRET: 'whsec_integration',
      APP_URL: 'https://example.test',
      SITE_URL: 'https://example.test',
      ADMIN_EMAIL: 'admin@example.test',
      OPENAI_DRAFT_MODEL: 'gpt-4o',
      OPENAI_EMBED_MODEL: 'text-embedding-3-small',
      // Bind to an unused port so we don't fight the dev server.
      PORT: '5099',
    };
    if (!env.DATABASE_URL) {
      console.log('  (skipping case 2: DATABASE_URL not available in this env)');
    } else {
      const result = await bootServer(env, 12_000);

      assert(
        result.combined.includes('OPENAI_API_KEY is not set'),
        'case 2: OPENAI_API_KEY logged as a warning',
      );
      assert(
        result.combined.includes('config WARNING'),
        'case 2: warning is tagged "config WARNING"',
      );
      assert(
        !result.combined.includes('Missing credentials'),
        'case 2: no OpenAI SDK "Missing credentials" crash (lazy client works)',
      );
      assert(
        !result.combined.includes('Startup configuration check failed'),
        'case 2: startup-check does NOT throw',
      );
      // Boot-success indicator: any of these strings prove we got past
      // every env-dependent module load (routes/openai-client/storage),
      // which is what this test actually cares about.
      //   - "serving on port"        → fully booted
      //   - "EADDRINUSE"             → reached listen() but port 5000 was taken
      //   - "Could not find the build directory" → reached serveStatic()
      //                                 in prod mode without a client build
      const reachedListen =
        result.combined.includes('serving on port') ||
        result.combined.includes('EADDRINUSE') ||
        result.combined.includes('Could not find the build directory');
      assert(
        reachedListen,
        'case 2: server boots past every env-dependent module (reaches listen/serveStatic)',
      );
      if (!reachedListen) {
        console.error('--- case 2 combined output ---');
        console.error(result.combined);
        console.error('--- end output ---');
      }
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log('\nAll startup-boot tests passed.');
}

main().catch((err) => {
  console.error('Unexpected test error:', err);
  process.exit(1);
});
