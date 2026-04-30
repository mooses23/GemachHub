/**
 * Unit tests for the pure recovery helpers in `server/backfill-mojibake.ts`.
 *
 * The mojibake migration is the safety net for the Gmail import bug fixed
 * in #166 / backfilled in #167. The helpers it depends on
 * (`looksLikeMojibake`, `tryDoubleDecode`, `tryRecoverString`) are pure
 * functions that have to:
 *
 *   * detect every flavour of corruption in stored rows,
 *   * never false-positive on legitimate French / Hebrew / emoji text,
 *   * never silently destroy characters when re-encoding through
 *     windows-1252 (the codec replaces unrepresentable codepoints with `?`).
 *
 * This file exercises each rule with a small, focused fixture set so a
 * future change to the regex or the round-trip guard fails loudly here
 * instead of silently corrupting production data.
 *
 * Run with: `npx tsx scripts/test-mojibake-recovery.ts`
 *
 * Exits non-zero on the first failure.
 */

import {
  looksLikeMojibake,
  tryDoubleDecode,
  tryRecoverString,
} from "../server/backfill-mojibake.js";

interface Case {
  desc: string;
  input: string;
  expectDetected: boolean;
  expectFixed: string | null;
}

const cases: Case[] = [
  // ── Negatives: must NOT be detected as mojibake ────────────────────────
  {
    desc: "plain ascii is not mojibake",
    input: "Hello world, please call me back.",
    expectDetected: false,
    expectFixed: null,
  },
  {
    desc: "valid utf-8 french with cedilla and apostrophe is not mojibake",
    input: "Tu n'es pas Français?",
    expectDetected: false,
    expectFixed: null,
  },
  {
    desc: "valid utf-8 hebrew is not mojibake",
    input: "שלום, מה שלומך?",
    expectDetected: false,
    expectFixed: null,
  },
  {
    desc: "valid utf-8 with curly quotes is not mojibake",
    input: "She said \u201chello\u201d and walked away \u2014 then waved.",
    expectDetected: false,
    expectFixed: null,
  },
  {
    desc: "emoji is not mojibake",
    input: "Hi 👋 — borrowing for Shabbos 🕯️",
    expectDetected: false,
    expectFixed: null,
  },

  // ── Single-pass mojibake (windows-1252-as-bytes → UTF-8). The
  //    inputs are the *actual* codepoint sequences that the pre-#166
  //    decoder produced for these characters; copy-paste them verbatim
  //    and don't assume the source-file glyph matches what's stored.
  {
    desc: "right single quote (â€™) recovers to U+2019",
    // chars: â (U+00E2) + € (U+20AC) + ™ (U+2122) — UTF-8 of U+2019 read as 1252
    input: "Don\u00e2\u20ac\u2122t worry about it",
    expectDetected: true,
    expectFixed: "Don\u2019t worry about it",
  },
  {
    desc: "left double quote recovers",
    // chars: â + € + œ (U+0153) — UTF-8 of U+201C read as 1252
    input: "She said \u00e2\u20ac\u0153hello there",
    expectDetected: true,
    expectFixed: "She said \u201chello there",
  },
  {
    desc: "em dash recovers",
    // chars: â + € + " (U+201D) — UTF-8 of U+2014 read as 1252
    input: "Wait \u00e2\u20ac\u201d let me check",
    expectDetected: true,
    expectFixed: "Wait \u2014 let me check",
  },
  {
    desc: "Ã© recovers to é",
    // chars: Ã (U+00C3) + © (U+00A9) — UTF-8 of U+00E9 read as 1252
    input: "Caf\u00c3\u00a9 closed today",
    expectDetected: true,
    expectFixed: "Caf\u00e9 closed today",
  },

  // ── Double-nested mojibake (Ã¢â‚¬â„¢ → â€™ → ') ─────────────────────────
  {
    desc: "doubly-corrupted right single quote (Ã¢â‚¬â„¢) recovers in two passes",
    input: "Don\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u201e\u00a2t worry",
    expectDetected: true,
    expectFixed: "Don\u2019t worry",
  },

  // ── RFC 2047 encoded-word subjects ─────────────────────────────────────
  {
    desc: "rfc 2047 base64 subject decodes",
    input: "=?UTF-8?B?SGVsbG8gV29ybGQ=?=",
    expectDetected: true,
    expectFixed: "Hello World",
  },
  {
    desc: "rfc 2047 quoted-printable subject decodes",
    input: "=?UTF-8?Q?Caf=C3=A9?=",
    expectDetected: true,
    expectFixed: "Café",
  },

  // ── Unrecoverable: U+FFFD must be detected, never "fixed" ──────────────
  {
    desc: "U+FFFD replacement character is detected and left alone",
    input: "Lost data here: \uFFFD\uFFFD!",
    expectDetected: true,
    expectFixed: null,
  },

  // ── Lossy guard: never destroy hebrew/emoji when re-encoding ───────────
  {
    desc: "mixed hebrew + question mark + mojibake token is left alone (lossy guard)",
    // Body has a real `?`, real Hebrew text, AND one mojibake token.
    // windows-1252 can't encode Hebrew, so the round-trip would replace
    // those bytes with `?` (0x3F). The lossless guard must catch this
    // and refuse to "recover" — the alternative is silently destroying
    // the Hebrew.
    input: "שלום? Don\u00e2\u20ac\u2122t worry",
    expectDetected: true,
    expectFixed: null,
  },
  {
    desc: "emoji + mojibake token is left alone (lossy guard)",
    input: "🕯️ Don\u00e2\u20ac\u2122t worry",
    expectDetected: true,
    expectFixed: null,
  },
];

let pass = 0;
let fail = 0;
const failures: string[] = [];

function check(desc: string, cond: boolean, detail: string): void {
  if (cond) {
    pass++;
  } else {
    fail++;
    failures.push(`FAIL: ${desc} — ${detail}`);
  }
}

for (const c of cases) {
  const detected = looksLikeMojibake(c.input);
  check(
    `[detect] ${c.desc}`,
    detected === c.expectDetected,
    `detected=${detected} expected=${c.expectDetected}`,
  );

  const result = tryRecoverString(c.input);

  if (c.expectFixed === null) {
    // Either we expect "not mojibake at all" (no recovery needed) or
    // "mojibake but unrecoverable" (recovery returns null).
    check(
      `[recover-null] ${c.desc}`,
      result.fixed === null,
      `fixed=${JSON.stringify(result.fixed)} expected=null`,
    );
  } else {
    check(
      `[recover-value] ${c.desc}`,
      result.fixed === c.expectFixed,
      `got=${JSON.stringify(result.fixed)} expected=${JSON.stringify(c.expectFixed)}`,
    );
    check(
      `[recover-clean] ${c.desc}`,
      result.fixed !== null && !looksLikeMojibake(result.fixed),
      `recovered string still flagged as mojibake`,
    );
  }
}

// Specific assertion for the hebrew RFC 2047 case: we don't pin the exact
// codepoints (encoders vary), but the result must not look mojibake-y.
{
  const r = tryRecoverString("=?UTF-8?B?15nXp9eV15Q=?=");
  check(
    "[recover-hebrew-rfc2047] hebrew encoded-word decodes to clean unicode",
    r.fixed !== null && !looksLikeMojibake(r.fixed) && /[\u0590-\u05FF]/.test(r.fixed),
    `got=${JSON.stringify(r.fixed)}`,
  );
}

// Direct double-decode round-trip safety: a string with no mojibake but
// that contains non-1252 codepoints must come back null (lossless guard).
{
  const r = tryDoubleDecode("שלום");
  check(
    "[double-decode-lossless] hebrew-only string is never recovered (would be lossy)",
    r === null,
    `got=${JSON.stringify(r)}`,
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ${f}`);
  process.exit(1);
}
process.exit(0);
