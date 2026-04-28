#!/usr/bin/env tsx
/**
 * AI drafting regression tests for Task #13.
 *
 * Run with: npx tsx scripts/test-ai-drafting.ts
 *
 * Locks in the three behaviors the retrieval-augmented drafting pipeline
 * has to guarantee, so a future refactor of openai-client.ts or the
 * /generate-response / /reply routes can't silently break:
 *
 *   1. A relevant FAQ ends up in result.citedSourceIds when an email
 *      asks about it (i.e. retrieval surfaces the FAQ AND the model's
 *      cited-id list is plumbed through the response).
 *   2. A low-confidence draft (model confidence < threshold) gets
 *      flagged for human review with an explanatory reviewReason.
 *   3. Sending a reply persists a reply_example row whose was_edited
 *      flag matches whether the admin actually changed the AI draft.
 *
 * No external services are contacted: storage is monkey-patched and the
 * OpenAI SDK calls are swapped out via __setOpenAIClientForTests.
 * Exits non-zero on failure.
 */
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "sk-test-stub-key";

import { storage } from "../server/storage.js";
import {
  generateEmailResponse,
  __setOpenAIClientForTests,
} from "../server/openai-client.js";
import { computeReplyWasEdited } from "../server/reply-edit-detection.js";
import { insertReplyExampleSchema } from "../shared/schema.js";
import type {
  Contact,
  ReplyExample,
  Transaction,
  GemachApplication,
  Location,
  PlaybookFact,
  FaqEntry,
  KnowledgeDoc,
  KbEmbedding,
  InsertReplyExample,
} from "../shared/schema.js";

// ---------- Tiny test harness (mirrors scripts/test-inbox-threading.ts) ----------

type Result = { name: string; ok: boolean; err?: string };
const results: Result[] = [];

function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      results.push({ name, ok: true });
    })
    .catch((e) => {
      results.push({ name, ok: false, err: e instanceof Error ? e.message : String(e) });
    });
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function eq<T>(actual: T, expected: T, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${label}\n  expected: ${e}\n  actual:   ${a}`);
}

// ---------- Storage / OpenAI patch helpers ----------

type StorageOverride = Partial<Record<keyof typeof storage, unknown>>;

function patchStorage(over: StorageOverride): () => void {
  const target = storage as unknown as Record<string, unknown>;
  const originals: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(over)) {
    originals[k] = target[k];
    target[k] = v;
  }
  return () => {
    for (const [k, v] of Object.entries(originals)) {
      target[k] = v;
    }
  };
}

// Build a fake openai chat-completion response shaped exactly like the
// piece generateEmailResponse reads (response.choices[0].message.content
// must be a JSON string).
function makeChatStub(payload: Record<string, unknown>) {
  return (async () => ({
    choices: [{ message: { content: JSON.stringify(payload) } }],
  })) as unknown as Parameters<typeof __setOpenAIClientForTests>[0]["chat"];
}

// Empty-storage defaults so each test only has to declare the rows it cares
// about — keeps the per-test overrides focused on what's actually under test.
const EMPTY_STORAGE: StorageOverride = {
  getContactsByEmail: async () => [] as Contact[],
  getReplyExamplesBySender: async () => [] as ReplyExample[],
  getReplyExamplesByRef: async () => [] as ReplyExample[],
  getTransactionsByEmail: async () => [] as Transaction[],
  getAllApplications: async () => [] as GemachApplication[],
  getAllLocations: async () => [] as Location[],
  getAllPlaybookFacts: async () => [] as PlaybookFact[],
  getAllFaqEntries: async () => [] as FaqEntry[],
  getAllKnowledgeDocs: async () => [] as KnowledgeDoc[],
  getAllKbEmbeddings: async () => [] as KbEmbedding[],
};

// Embed stub that returns a well-shaped but EMPTY embedding so semantic
// retrieval scores everything at 0 (filtered out by the > 0.2 threshold)
// and the keyword fallback takes over. Returning empty data would crash
// embedText with "Cannot read properties of undefined"; an empty embedding
// array reaches cosine() cleanly and routes to the fallback path silently.
const EMPTY_EMBED_STUB = (async () => ({ data: [{ embedding: [] as number[] }] })) as unknown as
  Parameters<typeof __setOpenAIClientForTests>[0]["embed"];

// ---------- Test 1: retrieval surfaces a relevant FAQ in citedSourceIds ----------
//
// Stubs embeddings to empty so semanticRetrieve gives up and the keyword
// fallback runs over the patched FAQ list. The chat stub then echoes back
// the discovered FAQ id as a citation, mirroring what the real model is
// supposed to do when a high-quality FAQ matches the question.

async function testFaqInCitedSources(): Promise<void> {
  const FAQ_ID = 42;
  const faq: FaqEntry = {
    id: FAQ_ID,
    question: "How long can I borrow the earmuffs?",
    answer: "You can borrow Baby Banz earmuffs for up to two weeks per loan.",
    language: "en",
    category: "borrowing",
    isActive: true,
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };

  const restoreStorage = patchStorage({
    ...EMPTY_STORAGE,
    getAllFaqEntries: async () => [faq],
  });

  // Force the keyword-fallback retrieval branch via the empty-embedding stub.
  __setOpenAIClientForTests({
    embed: EMPTY_EMBED_STUB,
    chat: makeChatStub({
      classification: "general_question",
      needsHumanReview: false,
      reviewReason: "",
      draft: "Hi! You can borrow them for up to two weeks. — Baby Banz Gemach",
      confidence: 0.92,
      // The whole point of this test: the model cited the FAQ that
      // retrieval surfaced, and the route plumbs it through unchanged.
      citedSourceIds: [`faq-${FAQ_ID}`],
      language: "en",
    }),
  });

  try {
    const result = await generateEmailResponse(
      "How long can I keep them?",
      "Hi — how many weeks can I borrow the earmuffs for?",
      "Asker",
      "asker@example.com",
      undefined,
      undefined,
    );

    await test(
      "FAQ id passes through citedSourceIds when retrieval surfaces it",
      () => {
        assert(
          result.citedSourceIds.includes(`faq-${FAQ_ID}`),
          `expected citedSourceIds to include "faq-${FAQ_ID}", got ${JSON.stringify(result.citedSourceIds)}`,
        );
      },
    );

    await test(
      "Retrieval surfaced the FAQ in result.sources so the model could cite it",
      () => {
        const sourceIds = result.sources.map((s) => `${s.kind}-${s.id}`);
        assert(
          sourceIds.includes(`faq-${FAQ_ID}`),
          `expected sources to include "faq-${FAQ_ID}", got ${JSON.stringify(sourceIds)}`,
        );
      },
    );

    await test("High-confidence draft is NOT flagged for review", () => {
      eq(result.needsHumanReview, false, "needsHumanReview should be false at confidence 0.92");
    });
  } finally {
    __setOpenAIClientForTests({ chat: null, embed: null });
    restoreStorage();
  }
}

// ---------- Test 2: low-confidence draft is flagged for review ----------
//
// CONFIDENCE_THRESHOLD in openai-client.ts is 0.6. A model that returns
// 0.3 must trip needsHumanReview=true with a reviewReason that mentions
// the low-confidence trigger so admins know why the draft was held.

async function testLowConfidenceFlagged(): Promise<void> {
  const restoreStorage = patchStorage(EMPTY_STORAGE);
  __setOpenAIClientForTests({
    embed: EMPTY_EMBED_STUB,
    chat: makeChatStub({
      classification: "other",
      // Model itself didn't ask for review — the threshold logic must do it.
      needsHumanReview: false,
      reviewReason: "",
      draft: "I'm not 100% sure but here's a guess.",
      confidence: 0.3,
      citedSourceIds: [],
      language: "en",
    }),
  });

  try {
    const result = await generateEmailResponse(
      "Random question",
      "Some ambiguous content the model is not confident about.",
      "Asker",
      "asker@example.com",
      undefined,
      undefined,
    );

    await test("Low confidence (< threshold) flips needsHumanReview to true", () => {
      eq(result.needsHumanReview, true, "needsHumanReview should be true at confidence 0.3");
    });

    await test("Low-confidence reviewReason explains why", () => {
      const reason = String(result.reviewReason || "").toLowerCase();
      assert(
        reason.includes("confidence"),
        `expected reviewReason to mention "confidence", got "${result.reviewReason}"`,
      );
    });

    await test("Reported confidence is preserved on the response", () => {
      // Sanity check: the threshold-based flag fires off the same value the
      // admin UI surfaces, so they match what the model actually returned.
      assert(
        Math.abs(result.confidence - 0.3) < 1e-6,
        `expected confidence 0.3, got ${result.confidence}`,
      );
    });
  } finally {
    __setOpenAIClientForTests({ chat: null, embed: null });
    restoreStorage();
  }
}

// ---------- Test 3: sending a reply persists reply_example with was_edited ----------
//
// This mirrors the body of /api/admin/emails/:id/reply and
// /api/contact/:id/respond — both compute wasEdited via
// computeReplyWasEdited(aiDraft, replyText), validate via
// insertReplyExampleSchema, then call storage.createReplyExample.
// We capture every createReplyExample call so we can assert the row that
// would actually have been written matches what the admin sent.

async function testReplyExampleWasEdited(): Promise<void> {
  const captured: InsertReplyExample[] = [];
  const restoreStorage = patchStorage({
    ...EMPTY_STORAGE,
    createReplyExample: async (rec: InsertReplyExample): Promise<ReplyExample> => {
      captured.push(rec);
      return {
        id: captured.length,
        sourceType: rec.sourceType,
        sourceRef: rec.sourceRef ?? null,
        senderEmail: rec.senderEmail ?? null,
        senderName: rec.senderName ?? null,
        incomingSubject: rec.incomingSubject,
        incomingBody: rec.incomingBody,
        sentReply: rec.sentReply,
        classification: rec.classification ?? null,
        language: rec.language ?? "en",
        matchedLocationId: rec.matchedLocationId ?? null,
        wasEdited: rec.wasEdited ?? false,
        createdAt: new Date(),
      } satisfies ReplyExample;
    },
  });

  // Helper that runs through exactly the same sequence the routes do:
  // compute wasEdited, validate via the insert schema, persist.
  async function persistReplyAsRouteWould(args: {
    aiDraft: string | null | undefined;
    replyText: string;
  }) {
    const wasEdited = computeReplyWasEdited(args.aiDraft, args.replyText);
    const parsed = insertReplyExampleSchema.parse({
      sourceType: "email",
      sourceRef: "thread-abc",
      senderEmail: "asker@example.com",
      senderName: "Asker",
      incomingSubject: "Question",
      incomingBody: "Body",
      sentReply: args.replyText,
      classification: "general_question",
      language: "en",
      matchedLocationId: null,
      wasEdited,
    } satisfies InsertReplyExample);
    return storage.createReplyExample(parsed);
  }

  try {
    // Case A — admin sent the AI draft verbatim → was_edited must be FALSE.
    await persistReplyAsRouteWould({
      aiDraft: "Hello! Here is your answer.\n\n— Baby Banz Gemach",
      replyText: "Hello! Here is your answer.\n\n— Baby Banz Gemach",
    });
    // Case B — admin tweaked the AI draft (extra "Quick note: ") → TRUE.
    await persistReplyAsRouteWould({
      aiDraft: "Hello! Here is your answer.\n\n— Baby Banz Gemach",
      replyText: "Hello! Quick note: here is your answer.\n\n— Baby Banz Gemach",
    });
    // Case C — admin wrote the reply from scratch (no AI draft) → FALSE,
    // because there's no draft to consider "edited".
    await persistReplyAsRouteWould({
      aiDraft: undefined,
      replyText: "From-scratch reply.",
    });
    // Case D — AI draft only differs by trailing/internal whitespace →
    // normalization should treat it as unchanged.
    await persistReplyAsRouteWould({
      aiDraft: "Hello there.   \n\nThanks!",
      replyText: "Hello there. Thanks!",
    });

    await test("4 reply_example rows persisted (one per send)", () => {
      eq(captured.length, 4, "createReplyExample should be invoked once per reply");
    });

    await test("Verbatim send → wasEdited=false", () => {
      eq(captured[0].wasEdited, false, "Case A: identical draft and reply");
    });

    await test("Tweaked send → wasEdited=true", () => {
      eq(captured[1].wasEdited, true, "Case B: admin added wording to the draft");
    });

    await test("From-scratch reply (no AI draft) → wasEdited=false", () => {
      eq(captured[2].wasEdited, false, "Case C: missing aiDraft must not count as an edit");
    });

    await test("Whitespace-only differences → wasEdited=false", () => {
      eq(captured[3].wasEdited, false, "Case D: normalization absorbs whitespace differences");
    });
  } finally {
    restoreStorage();
  }
}

// ---------- Direct unit tests on the wasEdited helper ----------
//
// Belt-and-suspenders: even if a future routes.ts refactor stops calling
// computeReplyWasEdited entirely, these tests still pin down the rule
// itself, so reviewers see exactly which edge cases we care about.

await test("computeReplyWasEdited: empty/null aiDraft → false", () => {
  eq(computeReplyWasEdited(null, "any reply"), false, "null draft");
  eq(computeReplyWasEdited(undefined, "any reply"), false, "undefined draft");
  eq(computeReplyWasEdited("", "any reply"), false, "empty-string draft");
});

await test("computeReplyWasEdited: identical text → false", () => {
  eq(
    computeReplyWasEdited("Hello world", "Hello world"),
    false,
    "exact match",
  );
});

await test("computeReplyWasEdited: whitespace-only diff → false (normalized)", () => {
  eq(
    computeReplyWasEdited("Hello   world\n", "Hello world"),
    false,
    "normalization should collapse whitespace before comparing",
  );
});

await test("computeReplyWasEdited: real edit → true", () => {
  eq(
    computeReplyWasEdited("Hello world", "Hello, dear world"),
    true,
    "added punctuation/words count as an edit",
  );
});

// ---------- Run integration tests ----------

await testFaqInCitedSources();
await testLowConfidenceFlagged();
await testReplyExampleWasEdited();

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
