#!/usr/bin/env node
/**
 * scripts/schema-snapshot.mjs — Task #177
 *
 * Postgres schema snapshot generator + drift checker.
 *
 * Background
 * ----------
 * This project does not run drizzle-kit push or any migration tool. Schema
 * evolution is performed by the idempotent ALTER/CREATE statements in
 * server/databaseStorage.ts ensureSchemaUpgrades(). That works, but it leaves
 * "shared/schema.ts vs prod" drift discoverable only at request time (see
 * Task #175 — playbook_facts and faq_entries were declared in code but never
 * created in prod).
 *
 * What this does
 * --------------
 * Shells out to `pg_dump --schema-only` against the live DB and emits a
 * normalized, line-diff-friendly snapshot. The snapshot is committed to
 * drizzle/schema-snapshot.sql so:
 *
 *   - PR reviewers can see schema deltas in the diff (drift becomes visible
 *     at PR time instead of request time).
 *   - A weekly cron route (GET /api/admin/schema-snapshot/check) compares
 *     prod against the committed snapshot and emails admin on drift.
 *   - The committed file is a real, replayable baseline: piped into `psql`
 *     against an empty database it recreates tables, sequences, indexes,
 *     constraints, functions, views, triggers, and extensions used by the
 *     app. (Use `--no-owner --no-privileges` so the dump is portable
 *     across environments.)
 *
 * Why pg_dump (and not custom information_schema introspection)
 * ------------------------------------------------------------
 * pg_dump is the canonical source of truth for a Postgres schema and is the
 * only artifact guaranteed to round-trip back to a working schema. We pin
 * the diff stability by:
 *   - using the matching pg_dump major version (16) shipped with the
 *     postgresql Nix package on Replit and the prod cluster;
 *   - stripping the variable header lines pg_dump emits ("Dumped from
 *     database version ...", "Dumped by pg_dump version ...") and the
 *     session-only `SET ...` / `SELECT pg_catalog.set_config(...)` lines
 *     that don't represent schema;
 *   - collapsing runs of blank lines so a stray newline doesn't blow up
 *     the diff.
 *
 * CLI
 * ---
 *   node scripts/schema-snapshot.mjs           # default: --check
 *   node scripts/schema-snapshot.mjs --check   # exit 1 on drift, print diff
 *   node scripts/schema-snapshot.mjs --write   # rewrite the committed snapshot
 *   node scripts/schema-snapshot.mjs --print   # print snapshot to stdout
 *   node scripts/schema-snapshot.mjs --verbose # full unified diff (with --check)
 *
 * Programmatic API (used by server/schema-snapshot.ts)
 * ----------------------------------------------------
 *   import {
 *     dumpSchema, normalizeDump, diffSnapshots, compactDiff,
 *     readCommittedSnapshot, SNAPSHOT_PATH,
 *   } from '../scripts/schema-snapshot.mjs';
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const SNAPSHOT_PATH = resolve(__dirname, '..', 'drizzle', 'schema-snapshot.sql');

const HEADER = [
  '-- AUTO-GENERATED schema snapshot. Do not edit by hand.',
  '-- Source: pg_dump --schema-only --no-owner --no-privileges --no-comments',
  '-- Regenerate with: node scripts/schema-snapshot.mjs --write',
  '-- Verify with:    node scripts/schema-snapshot.mjs --check',
  '-- See scripts/schema-snapshot.mjs (Task #177) for what this captures.',
  '',
];

/**
 * Run `pg_dump --schema-only` against the given database URL and return
 * the raw stdout. Caller should pass the result through normalizeDump()
 * before comparing or writing.
 *
 * Flags rationale:
 *   --schema-only       structure only, never data
 *   --no-owner          avoid OWNER TO clauses (varies per env)
 *   --no-privileges     avoid GRANT/REVOKE (varies per env)
 *   --no-comments       avoid COMMENT ON statements (rare, often noisy)
 *   --schema=public     scope to the schema the app actually uses
 *
 * @param {string} databaseUrl — full Postgres connection string
 * @returns {Promise<string>} raw pg_dump stdout
 */
export function dumpSchema(databaseUrl) {
  return new Promise((resolvePromise, rejectPromise) => {
    const proc = spawn(
      'pg_dump',
      [
        '--schema-only',
        '--no-owner',
        '--no-privileges',
        '--no-comments',
        '--schema=public',
        databaseUrl,
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });
    proc.on('error', (err) => {
      // ENOENT here means pg_dump isn't on PATH — surface that clearly
      // because the rest of the pipeline depends on it.
      if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') {
        rejectPromise(
          new Error(
            'pg_dump binary not found on PATH. Install the postgresql ' +
              'client tools (Replit: ensure the postgresql nix package is ' +
              'present) before running schema-snapshot.',
          ),
        );
      } else {
        rejectPromise(err);
      }
    });
    proc.on('close', (code) => {
      if (code !== 0) {
        rejectPromise(
          new Error(`pg_dump exited with code ${code}: ${stderr.trim()}`),
        );
      } else {
        resolvePromise(stdout);
      }
    });
  });
}

/**
 * Canonicalize a pg_dump output so it diffs cleanly across runs. We
 * deliberately strip lines that vary between dumps but do not represent
 * actual schema state, then prepend our HEADER comment so the committed
 * file is self-documenting.
 *
 * Stripped:
 *   - "-- Dumped from database version X.Y" / "-- Dumped by pg_dump ..."
 *   - "-- *not* dumped" notices for objects we excluded
 *   - SET <session_setting> = ...; (session-local, not schema)
 *   - SELECT pg_catalog.set_config(...); (session-local)
 *   - Generic "--" section banners that pg_dump injects (kept lines that
 *     are object-level "-- Name: foo; Type: TABLE; ..." comments because
 *     they make diffs much easier to read)
 *
 * Also collapses runs of blank lines into a single blank line.
 *
 * @param {string} text — raw pg_dump output
 * @returns {string} normalized snapshot text
 */
export function normalizeDump(text) {
  const lines = text.split('\n');
  const out = [...HEADER];
  let lastBlank = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');

    // Drop volatile header annotations.
    if (/^-- Dumped (from|by) /.test(line)) continue;

    // Drop session-only SET / set_config lines.
    if (/^SET\s/.test(line)) continue;
    if (/^SELECT\s+pg_catalog\.set_config\b/.test(line)) continue;

    // Drop the per-dump random tokens that newer pg_dump (16+) emits.
    // These are a transport-time integrity guard that has nothing to do
    // with the schema itself; if we kept them every snapshot would diff.
    if (/^\\(?:un)?restrict\s/.test(line)) continue;

    // Drop the standalone "--" separators that pg_dump injects between
    // sections; they create high-frequency, low-information diff noise.
    if (line === '--') continue;

    // Collapse blank-line runs.
    const blank = line.trim() === '';
    if (blank && lastBlank) continue;
    lastBlank = blank;

    out.push(line);
  }

  // Ensure exactly one trailing newline.
  return out.join('\n').replace(/\n+$/, '\n');
}

/**
 * Compute a unified-diff-style line diff between two snapshots. Returns an
 * empty string when they match. We use a small Myers-style LCS — good enough
 * for snapshots in the low tens of KB and avoids a runtime dependency.
 *
 * Output lines:
 *   "  foo" — context (unchanged)
 *   "- foo" — only in expected (committed)
 *   "+ foo" — only in actual (live DB)
 *
 * @param {string} expected — committed snapshot
 * @param {string} actual   — freshly dumped snapshot
 */
export function diffSnapshots(expected, actual) {
  if (expected === actual) return '';
  const a = expected.split('\n');
  const b = actual.split('\n');
  const m = a.length;
  const n = b.length;
  const lcs = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push(`  ${a[i]}`);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push(`- ${a[i]}`);
      i++;
    } else {
      out.push(`+ ${b[j]}`);
      j++;
    }
  }
  while (i < m) out.push(`- ${a[i++]}`);
  while (j < n) out.push(`+ ${b[j++]}`);
  return out.join('\n');
}

/**
 * Strip context lines from a unified-diff string and keep at most a few
 * surrounding lines per change hunk. Useful for embedding a drift summary
 * in an admin email where the full diff would be overwhelming.
 *
 * @param {string} diff — output of diffSnapshots
 * @param {number} contextLines — context lines to keep on each side (default 2)
 */
export function compactDiff(diff, contextLines = 2) {
  if (!diff) return '';
  const lines = diff.split('\n');
  const keep = new Array(lines.length).fill(false);
  for (let i = 0; i < lines.length; i++) {
    const ch = lines[i].charAt(0);
    if (ch === '+' || ch === '-') {
      const lo = Math.max(0, i - contextLines);
      const hi = Math.min(lines.length - 1, i + contextLines);
      for (let k = lo; k <= hi; k++) keep[k] = true;
    }
  }
  const out = [];
  let lastKept = -2;
  for (let i = 0; i < lines.length; i++) {
    if (!keep[i]) continue;
    if (lastKept >= 0 && i - lastKept > 1) out.push('  ...');
    out.push(lines[i]);
    lastKept = i;
  }
  return out.join('\n');
}

/**
 * Read the committed snapshot. Returns null if the file does not exist yet
 * (first-run case — caller can decide whether that's a hard error).
 */
export async function readCommittedSnapshot(path = SNAPSHOT_PATH) {
  if (!existsSync(path)) return null;
  return readFile(path, 'utf8');
}

async function runCli() {
  const args = new Set(process.argv.slice(2));
  const mode = args.has('--write') ? 'write' : args.has('--print') ? 'print' : 'check';

  if (!process.env.DATABASE_URL) {
    console.error('schema-snapshot: DATABASE_URL is not set; cannot connect.');
    process.exit(2);
  }

  const raw = await dumpSchema(process.env.DATABASE_URL);
  const snapshot = normalizeDump(raw);

  if (mode === 'print') {
    process.stdout.write(snapshot);
    return;
  }

  if (mode === 'write') {
    await writeFile(SNAPSHOT_PATH, snapshot, 'utf8');
    console.log(`schema-snapshot: wrote ${SNAPSHOT_PATH} (${snapshot.length} bytes).`);
    return;
  }

  // mode === 'check'
  const committed = await readCommittedSnapshot();
  if (committed == null) {
    console.error(
      `schema-snapshot: no committed snapshot at ${SNAPSHOT_PATH}. ` +
        'Run `node scripts/schema-snapshot.mjs --write` to create the baseline.',
    );
    process.exit(2);
  }

  const diff = diffSnapshots(committed, snapshot);
  if (!diff) {
    console.log('schema-snapshot: OK — live DB matches committed snapshot.');
    return;
  }
  console.error('schema-snapshot: DRIFT detected. Live DB differs from committed snapshot:');
  const verbose = args.has('--verbose');
  console.error(verbose ? diff : compactDiff(diff));
  console.error(
    '\nIf this drift is intentional, regenerate the snapshot with ' +
      '`node scripts/schema-snapshot.mjs --write` and commit the change.',
  );
  process.exit(1);
}

// Only run as CLI when invoked directly (not when imported).
//
// IMPORTANT: we deliberately do NOT use `resolve(process.argv[1]) === __filename`.
// When this module is bundled into dist/index.js by esbuild, `import.meta.url`
// (and therefore __filename) is rewritten to the bundle's URL, which matches
// `process.argv[1]` at production server boot — that would unexpectedly kick
// off runCli() and call process.exit() inside the live server. Instead we
// require the invoked file's basename to literally be schema-snapshot.mjs,
// which is true for the CLI (`node scripts/schema-snapshot.mjs`) and false
// for the bundled server entrypoint (`node dist/index.js`).
const isCli =
  typeof process.argv[1] === 'string' &&
  /(?:^|[\\/])schema-snapshot\.mjs$/.test(process.argv[1]);
if (isCli) {
  runCli().catch((err) => {
    console.error('schema-snapshot: fatal error:', err);
    process.exit(2);
  });
}
