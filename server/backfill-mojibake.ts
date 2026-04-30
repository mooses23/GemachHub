/**
 * One-shot backfill: re-decode mojibake / un-decoded RFC 2047 encoded-words
 * left behind in `reply_examples` rows by the pre-#166 Gmail body decoder.
 *
 * Background: until task #166 the body extractor unconditionally called
 * `Buffer.from(data, 'base64').toString('utf-8')` on MIME parts and didn't
 * touch `=?...?=` headers, so any windows-1252 / iso-8859-1 message saved
 * a `reply_examples` row with one of:
 *   * literal `=?UTF-8?B?...?=` Subject text (encoded-word never decoded),
 *   * `Ã¢â‚¬â„¢` / `â€™` / `Ã©` style mojibake (windows-1252 bytes
 *     re-interpreted as latin1 and re-stored as UTF-8), or
 *   * `\uFFFD` replacement characters (single-byte chars that the strict
 *     UTF-8 decoder dropped — unrecoverable from the row alone).
 *
 * The fix walks every reply_example, runs each text column through a
 * detection regex, and tries to recover in this order:
 *
 *   1. RFC 2047 encoded-word decode (`=?charset?B|Q?...?=`) — fully
 *      reversible from the stored string, no Gmail round-trip needed.
 *   2. "Double-decode" recovery (`Buffer.from(s, 'latin1').toString('utf-8')`
 *      strict): undoes the windows-1252-as-latin1 → UTF-8 corruption when
 *      it happens to be invertible.
 *   3. Re-fetch from Gmail (only when `--refetch` is passed AND the row's
 *      sourceType is 'email' AND the sourceRef looks like a Gmail message
 *      id). Uses the post-#166 decoder so the new value is correct.
 *
 * Anything still mojibake-looking after all three steps is logged with the
 * row id for manual review.
 *
 * Run modes:
 *   tsx server/backfill-mojibake.ts                # dry-run by default
 *   tsx server/backfill-mojibake.ts --apply        # write fixes
 *   tsx server/backfill-mojibake.ts --apply --refetch
 *                                                  # also re-fetch from Gmail
 *   tsx server/backfill-mojibake.ts --apply --reindex
 *                                                  # refresh kb_embeddings
 *
 * The script intentionally lives outside the request lifecycle: it does
 * not run on app startup, it has no `/api` mount, and it exits when done.
 */

import iconv from "iconv-lite";
import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { replyExamples, type ReplyExample } from "../shared/schema.js";
import { decodeRfc2047Header, getEmail } from "./gmail-client.js";

const APPLY = process.argv.includes("--apply");
const REFETCH = process.argv.includes("--refetch");
const REINDEX = process.argv.includes("--reindex");

// Mojibake / un-decoded encoded-word detector.
//
// We *intentionally* avoid `[ÃÂâ]` alone — those letters appear in real
// French / Portuguese text. The patterns below only fire on sequences
// that are produced when UTF-8 bytes are re-interpreted through
// windows-1252:
//
//   * `=?...?[BQ]?...?=`        literal RFC 2047 encoded-word that the
//                               header decoder never ran on.
//   * `â€` (U+00E2 U+20AC)      UTF-8 lead bytes E2 80 of every
//                               typographic punctuation char (curly
//                               quotes / dashes / ellipsis) read as
//                               windows-1252. The two-codepoint sequence
//                               `â€` is essentially never legitimate in
//                               real text, so no per-suffix allow-list
//                               is needed.
//   * `Ã[\u0080-\u00BF]`        UTF-8 lead byte 0xC3 mis-rendered as Ã
//                               followed by another latin-1 supplement
//                               char (0x80-0xBF range). Catches `Ã©`,
//                               `Ã¼`, `Ã¨`, `Ã«`, `Ã§`, …
//   * `Â[\u0080-\u00BF]`        UTF-8 lead byte 0xC2 mis-rendered as Â
//                               + continuation (NBSP / soft-hyphen / ©).
//   * `â‚¬`, `â„¢`               UTF-8 of € and ™ when the body went
//                               through *two* mis-decode cycles.
//   * `\uFFFD`                  replacement character (lossy — flagged
//                               for manual review, never silently
//                               "fixed" because the original byte is
//                               irrecoverable).
const MOJIBAKE_RE =
  /=\?[^?]+\?[BbQq]\?|â€|Ã[\u0080-\u00BF]|Â[\u0080-\u00BF]|â‚¬|â„¢|\uFFFD/;

export function looksLikeMojibake(s: string | null | undefined): boolean {
  if (!s) return false;
  return MOJIBAKE_RE.test(s);
}

// Count of mojibake-signature matches in a string. Used as a strict
// monotonic-decrease check across recovery passes so we never accept a
// pass that *increases* the corruption signal (the sign that the round
// trip went the wrong way and produced new garbage).
function mojibakeScore(s: string): number {
  if (!s) return 0;
  const m = s.match(new RegExp(MOJIBAKE_RE.source, "g"));
  return m ? m.length : 0;
}

// Attempt the windows-1252-as-bytes → UTF-8 recovery. The mojibake we're
// undoing was produced by `iconv.decode(utf8Bytes, 'windows-1252')`, so to
// invert it we re-encode each codepoint as its windows-1252 byte (which
// covers the typographic-quote / em-dash / euro / TM range that latin1
// proper does NOT, since 0x80-0x9F are unassigned in latin1).
//
// Lossless guard: after encoding, we decode the bytes back through the
// same windows-1252 codec and require the round-trip to reproduce the
// input *exactly*. iconv-lite silently substitutes `?` (0x3F) for any
// codepoint outside the 1252 repertoire (Hebrew, emoji, Cyrillic, …),
// so without this check a body that mixes one mojibake token with real
// Hebrew text would have the Hebrew silently destroyed. Only after the
// round-trip succeeds do we re-decode the bytes as strict UTF-8.
const STRICT_UTF8 = new TextDecoder("utf-8", { fatal: true });
export function tryDoubleDecode(s: string): string | null {
  let buf: Buffer;
  try {
    buf = iconv.encode(s, "windows-1252");
  } catch {
    return null;
  }
  let roundTrip: string;
  try {
    roundTrip = iconv.decode(buf, "windows-1252");
  } catch {
    return null;
  }
  if (roundTrip !== s) return null;
  try {
    return STRICT_UTF8.decode(buf);
  } catch {
    return null;
  }
}

interface RecoveryResult {
  fixed: string | null;
  method: string | null;
}

// Cap on how many times we apply the double-decode pass. Each successful
// pass collapses N mojibake bytes back to 1 codepoint, so even deeply
// nested corruption (`Ã¢â‚¬â„¢` → `â€™` → `'`) bottoms out in 2-3 passes.
const MAX_DOUBLE_DECODE_PASSES = 4;

export function tryRecoverString(s: string): RecoveryResult {
  if (!s) return { fixed: null, method: null };

  let working = s;
  const methods: string[] = [];

  // Step 1: RFC 2047 decode if there are encoded-words. Encoded-words
  // don't nest in practice, so a single pass is sufficient.
  if (working.includes("=?")) {
    const decoded = decodeRfc2047Header(working);
    if (decoded !== working) {
      working = decoded;
      methods.push("rfc2047");
    }
  }

  // Step 2: iterate double-decode while (a) the string still looks like
  // mojibake, (b) the windows-1252 round-trip is lossless, AND (c) each
  // pass strictly reduces the mojibake-signature count. The third check
  // is what stops us from accepting a "fix" that swapped one kind of
  // garbage for another.
  let passes = 0;
  while (passes < MAX_DOUBLE_DECODE_PASSES && looksLikeMojibake(working)) {
    const dd = tryDoubleDecode(working);
    if (dd === null || dd === working) break;
    if (mojibakeScore(dd) >= mojibakeScore(working)) break;
    working = dd;
    methods.push("double-decode");
    passes++;
  }

  if (working === s || looksLikeMojibake(working)) {
    return { fixed: null, method: null };
  }
  return { fixed: working, method: methods.join("+") };
}

// Columns we know contain raw decoded email text. `senderEmail` is excluded
// because it's the bare address, not a display name, and never carries
// non-ASCII bytes. `classification` is a controlled enum.
type TextColumn = "incomingSubject" | "incomingBody" | "sentReply" | "senderName";
const TEXT_COLUMNS: readonly TextColumn[] = [
  "incomingSubject",
  "incomingBody",
  "sentReply",
  "senderName",
];

// Typed accessor for the four text columns we re-decode. Avoids reaching
// into the row with `as any` casts and gives the compiler a fighting
// chance of catching schema drift if a column is renamed.
function readCol(row: ReplyExample, col: TextColumn): string | null {
  switch (col) {
    case "incomingSubject":
      return row.incomingSubject;
    case "incomingBody":
      return row.incomingBody;
    case "sentReply":
      return row.sentReply;
    case "senderName":
      return row.senderName;
  }
}

interface ColumnFix {
  method: string;
  before: string;
  after: string;
}

interface RowOutcome {
  id: number;
  sourceType: string;
  sourceRef: string | null;
  fixes: Partial<Record<TextColumn, ColumnFix>>;
  unrecovered: TextColumn[];
}

async function maybeRefetch(row: ReplyExample): Promise<Partial<Record<TextColumn, string>> | null> {
  if (!REFETCH) return null;
  if (row.sourceType !== "email" || !row.sourceRef) return null;
  try {
    const fresh = await getEmail(row.sourceRef);
    if (!fresh) return null;
    const out: Partial<Record<TextColumn, string>> = {};
    if (looksLikeMojibake(row.incomingSubject) && !looksLikeMojibake(fresh.subject)) {
      out.incomingSubject = fresh.subject;
    }
    if (looksLikeMojibake(row.incomingBody) && fresh.body && !looksLikeMojibake(fresh.body)) {
      out.incomingBody = fresh.body;
    }
    if (looksLikeMojibake(row.senderName ?? "") && !looksLikeMojibake(fresh.from)) {
      // From header is "Name <addr>"; pull the display-name half.
      const nameMatch = fresh.from.match(/^"?([^"<]*?)"?\s*<.+>$/);
      const name = nameMatch ? nameMatch[1].trim() : null;
      if (name) out.senderName = name;
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch (err) {
    console.warn(`  [refetch] message ${row.sourceRef} failed: ${(err as Error).message}`);
    return null;
  }
}

async function processRow(row: ReplyExample): Promise<RowOutcome> {
  const outcome: RowOutcome = {
    id: row.id,
    sourceType: row.sourceType,
    sourceRef: row.sourceRef,
    fixes: {},
    unrecovered: [],
  };

  for (const col of TEXT_COLUMNS) {
    const value = readCol(row, col);
    if (!value || !looksLikeMojibake(value)) continue;
    const r = tryRecoverString(value);
    if (r.fixed !== null && r.method !== null) {
      outcome.fixes[col] = { method: r.method, before: value, after: r.fixed };
    } else {
      outcome.unrecovered.push(col);
    }
  }

  if (outcome.unrecovered.length > 0) {
    const refetched = await maybeRefetch(row);
    if (refetched) {
      for (const col of Object.keys(refetched) as TextColumn[]) {
        const after = refetched[col]!;
        const before = readCol(row, col) ?? "";
        outcome.fixes[col] = { method: "refetch", before, after };
        outcome.unrecovered = outcome.unrecovered.filter((c) => c !== col);
      }
    }
  }

  return outcome;
}

async function applyFixes(outcome: RowOutcome): Promise<void> {
  const updates: Partial<Record<TextColumn, string>> = {};
  for (const col of Object.keys(outcome.fixes) as TextColumn[]) {
    updates[col] = outcome.fixes[col]!.after;
  }
  if (Object.keys(updates).length === 0) return;
  await db.update(replyExamples).set(updates).where(eq(replyExamples.id, outcome.id));
}

async function reindexFixed(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  // Lazy import: pulls in OpenAI client + heavy embedding code only when
  // explicitly requested via --reindex.
  const { reindexReplyExample } = await import("./openai-client.js");
  let ok = 0;
  let failed = 0;
  for (const id of ids) {
    const [r] = await db.select().from(replyExamples).where(eq(replyExamples.id, id));
    if (!r) continue;
    try {
      await reindexReplyExample(r);
      ok++;
    } catch (err) {
      failed++;
      console.warn(`  [reindex] id=${id} failed: ${(err as Error).message}`);
    }
  }
  console.log(`  Re-embedded ${ok} reply_examples (${failed} failed).`);
}

async function main(): Promise<void> {
  console.log(
    `[backfill-mojibake] mode=${APPLY ? "APPLY" : "DRY-RUN"} refetch=${REFETCH} reindex=${REINDEX}`,
  );

  const rows = await db.select().from(replyExamples);
  console.log(`Scanning ${rows.length} reply_examples rows...`);

  const fixedIds: number[] = [];
  const unrecoveredRows: RowOutcome[] = [];
  const methodCounts: Record<string, number> = {};
  let rowsWithFixes = 0;
  let rowsClean = 0;

  for (const row of rows) {
    const outcome = await processRow(row);
    const fixCount = Object.keys(outcome.fixes).length;
    if (fixCount === 0 && outcome.unrecovered.length === 0) {
      rowsClean++;
      continue;
    }
    if (fixCount > 0) {
      rowsWithFixes++;
      for (const info of Object.values(outcome.fixes)) {
        methodCounts[info.method] = (methodCounts[info.method] ?? 0) + 1;
      }
      if (APPLY) {
        await applyFixes(outcome);
        fixedIds.push(outcome.id);
      } else {
        // Show a one-line preview per fixed column so the operator can spot-check.
        for (const [col, info] of Object.entries(outcome.fixes)) {
          const before = info.before.replace(/\s+/g, " ").slice(0, 80);
          const after = info.after.replace(/\s+/g, " ").slice(0, 80);
          console.log(`  id=${outcome.id} ${col} [${info.method}]`);
          console.log(`    before: ${before}`);
          console.log(`    after : ${after}`);
        }
      }
    }
    if (outcome.unrecovered.length > 0) {
      unrecoveredRows.push(outcome);
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Clean rows           : ${rowsClean}`);
  console.log(`  Rows with fixes      : ${rowsWithFixes}`);
  console.log(`  Rows still corrupted : ${unrecoveredRows.length}`);
  if (Object.keys(methodCounts).length > 0) {
    console.log(`  Fix methods:`);
    for (const [m, n] of Object.entries(methodCounts)) {
      console.log(`    ${m.padEnd(28)} ${n}`);
    }
  }

  if (unrecoveredRows.length > 0) {
    console.log(`\nRows that need manual review (U+FFFD or unrecoverable):`);
    for (const o of unrecoveredRows) {
      console.log(
        `  id=${o.id} sourceType=${o.sourceType} sourceRef=${o.sourceRef ?? "(none)"} columns=[${o.unrecovered.join(", ")}]`,
      );
    }
    if (!REFETCH) {
      console.log(
        `\nHint: rerun with --refetch to pull a fresh copy from Gmail for rows whose sourceType is "email".`,
      );
    }
  }

  if (APPLY && REINDEX && fixedIds.length > 0) {
    console.log(`\nRefreshing kb_embeddings for ${fixedIds.length} updated rows...`);
    await reindexFixed(fixedIds);
  } else if (APPLY && fixedIds.length > 0 && !REINDEX) {
    console.log(
      `\nHint: pass --reindex to refresh kb_embeddings so semantic search uses the corrected text.`,
    );
  }

  if (!APPLY) {
    console.log(`\nDry-run complete — pass --apply to write changes.`);
  }
}

// Allow this file to be imported (for tests) without auto-running.
const isDirectRun = (() => {
  const arg = process.argv[1] || "";
  return arg.endsWith("backfill-mojibake.ts") || arg.endsWith("backfill-mojibake.js");
})();

if (isDirectRun) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
