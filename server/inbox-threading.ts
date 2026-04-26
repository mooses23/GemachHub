import type { Contact } from "@shared/schema";

export function normalizeSubject(s: string): string {
  return String(s || "")
    .replace(/^\s*((re|fw|fwd|aw|tr)\s*:\s*)+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export type ContactThreadGroup = {
  key: string;
  latest: Contact;
  messageCount: number;
  unreadCount: number;
  memberIds: number[];
};

function ts(d: Date | string | null | undefined): number {
  if (!d) return 0;
  const v = d instanceof Date ? d : new Date(d);
  const t = v.getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function groupContactsByThread(contacts: Contact[]): ContactThreadGroup[] {
  const groups = new Map<string, ContactThreadGroup>();
  for (const c of contacts) {
    const k = `form::${(c.email || "").toLowerCase()}::${normalizeSubject(c.subject)}`;
    const tNew = ts(c.submittedAt as Date | string);
    const existing = groups.get(k);
    if (!existing) {
      groups.set(k, {
        key: k,
        latest: c,
        messageCount: 1,
        unreadCount: c.isRead ? 0 : 1,
        memberIds: [c.id],
      });
      continue;
    }
    existing.messageCount += 1;
    if (!c.isRead) existing.unreadCount += 1;
    existing.memberIds.push(c.id);
    const tCur = ts(existing.latest.submittedAt as Date | string);
    if (tNew > tCur) existing.latest = c;
  }
  return Array.from(groups.values()).sort(
    (a, b) => ts(b.latest.submittedAt as Date | string) - ts(a.latest.submittedAt as Date | string),
  );
}
