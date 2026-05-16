export interface CanonicalEntry {
  id: string | number;
  en?: string | null;
  he?: string | null;
  context?: string | null;
}

export function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[,\-_/\\.|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  const n = normalize(s);
  if (!n) return [];
  return n.split(" ").filter(Boolean);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = a.length, n = b.length;
  let prev = new Array(n + 1);
  let cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

function levenshteinRatio(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

function tokenSetRatio(a: string, b: string): number {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (!ta.size || !tb.size) return 0;
  let intersection = 0;
  ta.forEach((t) => {
    if (tb.has(t)) intersection++;
  });
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function scorePair(query: string, candidate: string): number {
  if (!query || !candidate) return 0;
  const nq = normalize(query);
  const nc = normalize(candidate);
  if (!nq || !nc) return 0;
  if (nq === nc) return 1;

  const lev = levenshteinRatio(nq, nc);
  const tok = tokenSetRatio(nq, nc);
  let score = Math.max(lev, tok);

  if (nc.startsWith(nq) || nq.startsWith(nc)) {
    score = Math.max(score, 0.9);
  }
  if (nc.includes(nq) || nq.includes(nc)) {
    score = Math.max(score, 0.85);
  }
  return score;
}

export interface SuggestionResult {
  entry: CanonicalEntry;
  /** Canonical display string (typically the EN form, falling back to HE). */
  canonical: string;
  /** Which side actually matched the query best. */
  matchedField: "en" | "he";
  score: number;
}

export interface SuggestOptions {
  /** Minimum confidence to return a hit. Default 0.78. */
  threshold?: number;
  /** Minimum query length before suggesting. Default 3. */
  minLength?: number;
  /**
   * Which canonical form to surface as the suggestion text. Matching
   * still considers BOTH the EN and HE form of every entry — this only
   * controls what string the user accepts. Defaults to "en", which
   * keeps English fields suggesting English canonical and Hebrew
   * fields can opt into "he".
   */
  preferCanonical?: "en" | "he";
}

/**
 * Returns the single best canonical suggestion for `query` among `entries`,
 * or null when nothing is confident enough.
 *
 * - Considers both EN and HE forms of each entry.
 * - Suggestion never repeats the exact (case-insensitive, whitespace-trimmed)
 *   value the user already typed.
 */
export function suggestBestMatch(
  query: string,
  entries: CanonicalEntry[],
  options: SuggestOptions = {},
): SuggestionResult | null {
  const threshold = options.threshold ?? 0.78;
  const minLength = options.minLength ?? 3;
  const preferCanonical = options.preferCanonical ?? "en";

  if (!query) return null;
  const trimmed = query.trim();
  if (trimmed.length < minLength) return null;
  if (!entries.length) return null;

  let best: SuggestionResult | null = null;
  for (const entry of entries) {
    const en = (entry.en || "").trim();
    const he = (entry.he || "").trim();
    if (!en && !he) continue;

    const enScore = en ? scorePair(trimmed, en) : 0;
    const heScore = he ? scorePair(trimmed, he) : 0;

    const matchedField: "en" | "he" = heScore > enScore ? "he" : "en";
    const score = Math.max(enScore, heScore);
    if (score < threshold) continue;

    // Canonical text surfaced for acceptance is the field's own
    // language by default (English fields → English canonical, Hebrew
    // fields → Hebrew canonical), regardless of which form actually
    // matched. We still match against both EN and HE forms so users
    // typing the Hebrew name in an English field also get nudged to
    // the existing record. Fall back to the other language when the
    // preferred one is missing.
    const canonical = preferCanonical === "he" ? (he || en) : (en || he);
    if (!canonical) continue;

    if (normalize(canonical) === normalize(trimmed)) continue;

    if (!best || score > best.score) {
      best = { entry, canonical, matchedField, score };
    }
  }

  return best;
}
