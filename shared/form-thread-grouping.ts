// Loose conversation grouping for form-side (web contact) submissions.
//
// Email-side conversations have Gmail's native threadId — when a borrower
// hits "Reply" the response is stitched back into the original thread no
// matter what they do to the subject line. Form-side conversations have no
// such anchor: every submission is an independent row in the contacts
// table. The original threading logic grouped form messages by
// `lowercased sender email + Re:/Fwd:-stripped subject`, which works when
// the borrower reuses the same subject but breaks when they file a fresh
// contact-form message about the same loan with a slightly different
// subject (or with the subject left blank).
//
// This helper widens the definition of "same conversation" for form
// messages so admins and the AI draft see the full back-and-forth even
// when the subject drifts. Two contacts from the same sender are linked
// when ANY of the following holds:
//   1. Their normalized subjects are identical (original behavior).
//   2. Their subjects are fuzzy-similar (token Jaccard >= 0.4 with at
//      least 2 shared meaningful tokens, or one is contained in the other).
//   3. Either subject is empty AND the messages land within
//      FALLBACK_TIME_WINDOW_MS of each other.
//   4. The messages land within TIGHT_TIME_WINDOW_MS of each other,
//      regardless of subject (catches "I forgot to mention…" follow-ups
//      with a brand-new subject line).
// Connected components over those pairwise links form the final groups.
//
// The same helper is used by the inbox list (collapses rows visually),
// the /api/admin/inbox/thread endpoint (returns the expanded transcript),
// and the AI's gatherContext (so drafts include the full history).

const PREFIX_RE = /^\s*((re|fw|fwd|aw|tr)\s*:\s*)+/i;

export function normalizeFormSubject(s: string): string {
  return String(s || "")
    .replace(PREFIX_RE, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeSenderEmail(e: string): string {
  return String(e || "").trim().toLowerCase();
}

// Common filler words that shouldn't, on their own, link two subjects.
const STOP_WORDS = new Set([
  "a", "an", "the", "of", "and", "or", "for", "to", "in", "on", "with",
  "about", "regarding", "re", "fwd", "fw", "aw", "tr", "my", "our", "your",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "but", "by", "as", "at", "from", "up", "out", "if",
  "this", "that", "these", "those", "i", "we", "you", "he", "she", "it",
  "they", "me", "us", "them", "no", "subject",
]);

function tokenSet(s: string): Set<string> {
  const norm = normalizeFormSubject(s);
  if (!norm) return new Set();
  // Split on anything that isn't a latin/digit/Hebrew character so
  // borrowers using either script get sensible tokens.
  const raw = norm.split(/[^a-z0-9\u0590-\u05ff]+/i).filter(Boolean);
  const out = new Set<string>();
  for (const t of raw) {
    if (t.length < 2) continue;
    if (STOP_WORDS.has(t)) continue;
    out.add(t);
  }
  return out;
}

export function subjectsAreSimilar(a: string, b: string): boolean {
  const na = normalizeFormSubject(a);
  const nb = normalizeFormSubject(b);
  if (na === nb && na.length > 0) return true;
  if (!na || !nb) return false;
  // Strict containment: "deposit refund" inside "question about deposit refund".
  if (na.length >= 4 && nb.includes(na)) return true;
  if (nb.length >= 4 && na.includes(nb)) return true;
  const ta = tokenSet(a);
  const tb = tokenSet(b);
  if (!ta.size || !tb.size) return false;
  let overlap = 0;
  ta.forEach((t) => { if (tb.has(t)) overlap++; });
  if (!overlap) return false;
  const union = ta.size + tb.size - overlap;
  if (!union) return false;
  const jaccard = overlap / union;
  // Require both a reasonable ratio AND a real shared-token count so two
  // unrelated subjects that happen to share a single keyword (e.g. both
  // mention "Banz") don't collapse into one conversation.
  return jaccard >= 0.4 && overlap >= 2;
}

const DAY_MS = 24 * 60 * 60 * 1000;
// When at least one subject is missing, two messages from the same
// sender within ~2 weeks are almost certainly the same conversation.
const FALLBACK_TIME_WINDOW_MS = 14 * DAY_MS;
// Even when both subjects are present and dissimilar, two submissions
// from the same sender within ~3 days are usually a quick follow-up.
const TIGHT_TIME_WINDOW_MS = 3 * DAY_MS;

export interface FormItemForGrouping {
  id: number | string;
  email: string;
  subject: string;
  date: Date | string | null | undefined;
}

export interface FormGrouping {
  /** id (string-coerced) -> canonical conversation key */
  keyByContactId: Map<string, string>;
  /** canonical key -> contact ids (string-coerced) in that conversation */
  membersByKey: Map<string, string[]>;
}

function tsOf(d: Date | string | null | undefined): number {
  if (!d) return 0;
  const t = (d instanceof Date ? d : new Date(d)).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function groupFormContacts(items: FormItemForGrouping[]): FormGrouping {
  const keyByContactId = new Map<string, string>();
  const membersByKey = new Map<string, string[]>();

  // Bucket by sender email; clustering only happens within a sender so a
  // chatty borrower can't accidentally pull in another borrower's thread.
  const bySender = new Map<string, FormItemForGrouping[]>();
  const orphanIds: string[] = [];
  for (const it of items) {
    const email = normalizeSenderEmail(it.email);
    if (!email) {
      // No email = nothing reliable to thread on. Keep it as its own group
      // so the row still renders.
      orphanIds.push(String(it.id));
      continue;
    }
    let bucket = bySender.get(email);
    if (!bucket) {
      bucket = [];
      bySender.set(email, bucket);
    }
    bucket.push(it);
  }

  for (const id of orphanIds) {
    const key = `form::orphan::${id}`;
    keyByContactId.set(id, key);
    membersByKey.set(key, [id]);
  }

  for (const [email, list] of Array.from(bySender.entries())) {
    // Sort oldest-first so the canonical key (and any "earliest subject"
    // label) is stable across re-renders for the same dataset.
    const sorted = [...list].sort((a, b) => tsOf(a.date) - tsOf(b.date));

    // Union-find over indices.
    const parent = sorted.map((_, i) => i);
    const find = (x: number): number => {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    };
    const union = (a: number, b: number) => {
      const ra = find(a);
      const rb = find(b);
      if (ra === rb) return;
      // Always re-root onto the smaller index so the canonical key stays
      // tied to the earliest message in the cluster.
      if (ra < rb) parent[rb] = ra;
      else parent[ra] = rb;
    };

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        if (find(i) === find(j)) continue; // already linked transitively
        const sa = normalizeFormSubject(a.subject);
        const sb = normalizeFormSubject(b.subject);
        const dt = Math.abs(tsOf(a.date) - tsOf(b.date));
        let link = false;
        if (sa && sb && sa === sb) link = true;
        else if (subjectsAreSimilar(a.subject, b.subject)) link = true;
        else if ((!sa || !sb) && dt <= FALLBACK_TIME_WINDOW_MS) link = true;
        else if (dt <= TIGHT_TIME_WINDOW_MS) link = true;
        if (link) union(i, j);
      }
    }

    const groupsByRoot = new Map<number, number[]>();
    for (let i = 0; i < sorted.length; i++) {
      const r = find(i);
      let g = groupsByRoot.get(r);
      if (!g) {
        g = [];
        groupsByRoot.set(r, g);
      }
      g.push(i);
    }

    for (const [root, indices] of Array.from(groupsByRoot.entries())) {
      // Union-find always re-roots onto the smaller index, and `sorted`
      // is oldest-first, so the root index points at the earliest message
      // in this cluster. Including its id in the canonical key keeps two
      // distinct clusters from the same sender that happen to share a
      // subject from colliding.
      const earliest = sorted[root];
      const subjPart = normalizeFormSubject(earliest.subject) || "(no subject)";
      const key = `form::${email}::${subjPart}::${String(earliest.id)}`;
      const ids = indices.map((i) => String(sorted[i].id));
      membersByKey.set(key, ids);
      for (const id of ids) keyByContactId.set(id, key);
    }
  }

  return { keyByContactId, membersByKey };
}

// Convenience: given the seed contact and the full set of contacts for
// that sender (e.g. from storage.getContactsByEmail), return ONLY the
// members in the same loose conversation. Used by the server endpoint
// and the AI context builder.
export function siblingsForSeed<T extends FormItemForGrouping>(
  seed: T,
  allFromSender: T[],
): T[] {
  const grouping = groupFormContacts(allFromSender);
  const seedKey = grouping.keyByContactId.get(String(seed.id));
  if (!seedKey) return [seed];
  const memberIds = new Set(grouping.membersByKey.get(seedKey) ?? [String(seed.id)]);
  return allFromSender.filter((c) => memberIds.has(String(c.id)));
}
