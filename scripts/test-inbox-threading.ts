#!/usr/bin/env tsx
/**
 * Inbox threading regression test.
 *
 * Run with: npx tsx scripts/test-inbox-threading.ts
 *
 * Locks in the behavior of the helpers that power the threaded inbox so a
 * future change can't silently regress: list collapsing into one row per
 * conversation, atomic per-thread mutations (every sibling moves together),
 * and the AI draft endpoint receiving the full thread.
 */
import { normalizeSubject, groupContactsByThread } from "../server/inbox-threading.js";
import type { Contact } from "../shared/schema.js";

type Result = { name: string; ok: boolean; err?: string };
const results: Result[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, err: e instanceof Error ? e.message : String(e) });
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq<T>(actual: T, expected: T, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${label}\n  expected: ${e}\n  actual:   ${a}`);
}

function makeContact(over: Partial<Contact> & Pick<Contact, "id" | "email" | "subject">): Contact {
  return {
    id: over.id,
    name: over.name ?? "Sender",
    email: over.email,
    subject: over.subject,
    message: over.message ?? "body",
    submittedAt: (over.submittedAt as Date) ?? new Date("2026-01-01T00:00:00Z"),
    isRead: over.isRead ?? false,
    isArchived: over.isArchived ?? false,
    isSpam: over.isSpam ?? false,
  } as Contact;
}

// ---------- normalizeSubject ----------

test("normalizeSubject: strips Re: / Fwd: / Aw: / Tr: prefixes", () => {
  eq(normalizeSubject("Re: Need stroller"), "need stroller", "single Re:");
  eq(normalizeSubject("RE: Re: re: Need stroller"), "need stroller", "stacked Re:");
  eq(normalizeSubject("Fwd: Need stroller"), "need stroller", "Fwd:");
  eq(normalizeSubject("FWD: Re: Need stroller"), "need stroller", "Fwd: Re:");
  eq(normalizeSubject("Aw: Need stroller"), "need stroller", "Aw: (German)");
  eq(normalizeSubject("Tr: Need stroller"), "need stroller", "Tr: (French)");
});

test("normalizeSubject: collapses whitespace and lowercases", () => {
  eq(normalizeSubject("  Need   a   STROLLER  "), "need a stroller", "whitespace+case");
});

test("normalizeSubject: handles empty / nullish input", () => {
  eq(normalizeSubject(""), "", "empty");
  eq(normalizeSubject(null as unknown as string), "", "null");
  eq(normalizeSubject(undefined as unknown as string), "", "undefined");
});

test("normalizeSubject: leaves bare prefix-like words alone", () => {
  eq(normalizeSubject("Reading Group"), "reading group", "bare 'Reading'");
  eq(normalizeSubject("Awesome donation"), "awesome donation", "bare 'Awesome'");
});

// ---------- groupContactsByThread ----------

test("groupContactsByThread: collapses 3 messages into 1 row with full counts", () => {
  const contacts: Contact[] = [
    makeContact({
      id: 1,
      email: "user@example.com",
      subject: "Need stroller",
      submittedAt: new Date("2026-01-01T10:00:00Z"),
      isRead: true,
    }),
    makeContact({
      id: 2,
      email: "user@example.com",
      subject: "Re: Need stroller",
      submittedAt: new Date("2026-01-02T10:00:00Z"),
      isRead: false,
    }),
    makeContact({
      id: 3,
      email: "user@example.com",
      subject: "Fwd: Re: Need stroller",
      submittedAt: new Date("2026-01-03T10:00:00Z"),
      isRead: false,
    }),
  ];

  const groups = groupContactsByThread(contacts);

  assert(groups.length === 1, `expected 1 group, got ${groups.length}`);
  const g = groups[0];
  eq(g.messageCount, 3, "messageCount counts every sibling (full thread)");
  eq(g.unreadCount, 2, "unreadCount counts every unread sibling");
  eq(g.memberIds.sort(), [1, 2, 3], "memberIds includes every sibling so per-thread mutations are atomic");
  eq(g.latest.id, 3, "latest is the newest message");
  eq(g.key, "form::user@example.com::need stroller", "group key normalizes both email and subject");
});

test("groupContactsByThread: case-insensitive email comparison", () => {
  const contacts: Contact[] = [
    makeContact({
      id: 10,
      email: "User@Example.com",
      subject: "Borrow request",
      submittedAt: new Date("2026-02-01T10:00:00Z"),
    }),
    makeContact({
      id: 11,
      email: "user@example.COM",
      subject: "Re: Borrow request",
      submittedAt: new Date("2026-02-02T10:00:00Z"),
    }),
  ];
  const groups = groupContactsByThread(contacts);
  assert(groups.length === 1, `expected 1 group across mixed-case emails, got ${groups.length}`);
  eq(groups[0].messageCount, 2, "mixed-case sender still groups together");
});

test("groupContactsByThread: keeps DIFFERENT senders as separate threads", () => {
  const contacts: Contact[] = [
    makeContact({ id: 20, email: "alice@example.com", subject: "Stroller" }),
    makeContact({ id: 21, email: "bob@example.com", subject: "Stroller" }),
  ];
  const groups = groupContactsByThread(contacts);
  assert(groups.length === 2, `expected 2 groups for 2 senders, got ${groups.length}`);
});

test("groupContactsByThread: keeps DIFFERENT subjects as separate threads", () => {
  const contacts: Contact[] = [
    makeContact({ id: 30, email: "u@example.com", subject: "Need stroller" }),
    makeContact({ id: 31, email: "u@example.com", subject: "Need car seat" }),
  ];
  const groups = groupContactsByThread(contacts);
  assert(groups.length === 2, `expected 2 groups for 2 subjects, got ${groups.length}`);
});

test("groupContactsByThread: sorts groups newest-first by latest message", () => {
  const contacts: Contact[] = [
    makeContact({
      id: 40, email: "old@example.com", subject: "Old thread",
      submittedAt: new Date("2026-01-01T00:00:00Z"),
    }),
    makeContact({
      id: 41, email: "new@example.com", subject: "New thread",
      submittedAt: new Date("2026-03-01T00:00:00Z"),
    }),
  ];
  const groups = groupContactsByThread(contacts);
  eq(groups.map((g) => g.latest.id), [41, 40], "newest thread first");
});

test("groupContactsByThread: empty input → empty output", () => {
  eq(groupContactsByThread([]), [], "empty");
});

// ---------- AI form-thread sibling selection ----------
// Mirrors the gatherContext form branch in server/openai-client.ts: given
// the sender's contacts and the current message id, the AI must receive the
// other siblings (same normalized subject) so the prompt has full context.

function selectFormThreadSiblings(
  contacts: Contact[],
  currentMessageId: string | undefined,
  emailSubject: string,
): Contact[] {
  const normSubj = normalizeSubject(emailSubject);
  const currentId = currentMessageId ? Number(currentMessageId) : NaN;
  return contacts.filter((c) => normalizeSubject(c.subject) === normSubj && c.id !== currentId);
}

test("AI form-thread: selects siblings with normalized subject and excludes the current message", () => {
  const contacts: Contact[] = [
    makeContact({ id: 100, email: "u@example.com", subject: "Need stroller" }),
    makeContact({ id: 101, email: "u@example.com", subject: "Re: Need stroller" }),
    makeContact({ id: 102, email: "u@example.com", subject: "Fwd: Need stroller" }),
    makeContact({ id: 103, email: "u@example.com", subject: "Different topic" }),
  ];
  const siblings = selectFormThreadSiblings(contacts, "102", "Fwd: Need stroller");
  eq(siblings.map((c) => c.id).sort(), [100, 101], "AI sees prior siblings, not the current msg or unrelated subject");
});

// ---------- Print results ----------

let failed = 0;
for (const r of results) {
  if (r.ok) console.log(`  PASS  ${r.name}`);
  else {
    failed += 1;
    console.log(`  FAIL  ${r.name}`);
    if (r.err) console.log(`        ${r.err.split("\n").join("\n        ")}`);
  }
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
