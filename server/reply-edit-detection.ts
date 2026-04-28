// Helpers for deciding whether the admin actually edited the AI draft
// before sending. Pulled out of routes.ts so the same exact rule is used
// for both contact-form replies and Gmail replies (so reply_examples are
// labelled consistently), and so the rule can be unit-tested without
// having to spin up the full Express stack.

export function normalizeReplyWhitespace(s: string | null | undefined): string {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

// Returns true only when there WAS an AI draft to compare against AND
// the sent reply differs from it after whitespace normalization. A nullish /
// empty draft means the admin wrote the reply from scratch — that is NOT
// an "edit" of an AI draft, so we report false (mirrors the previous inline
// `!!aiDraft && ...` guard in routes.ts).
export function computeReplyWasEdited(
  aiDraft: string | null | undefined,
  replyText: string | null | undefined,
): boolean {
  if (!aiDraft) return false;
  return normalizeReplyWhitespace(aiDraft) !== normalizeReplyWhitespace(replyText);
}
