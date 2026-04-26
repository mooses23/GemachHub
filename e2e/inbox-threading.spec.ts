import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";

const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "admin123";

const RUN_TAG = `e2eThread-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const SENDER_EMAIL = `${RUN_TAG.toLowerCase()}@e2e.test`;
const SENDER_NAME = "E2E Thread Sender";
const BASE_SUBJECT = `${RUN_TAG} Threading Spec`;

const SEED_MESSAGES: Array<{ subject: string; body: string }> = [
  { subject: BASE_SUBJECT, body: "First message in the thread (oldest)." },
  { subject: `Re: ${BASE_SUBJECT}`, body: "Second reply in the thread." },
  { subject: `Fwd: ${BASE_SUBJECT}`, body: "Third forwarded message in the thread (newest)." },
];

async function seedContactMessages(api: APIRequestContext): Promise<void> {
  for (const m of SEED_MESSAGES) {
    const res = await api.post("/api/contact", {
      data: {
        name: SENDER_NAME,
        email: SENDER_EMAIL,
        subject: m.subject,
        message: m.body,
      },
    });
    expect(res.ok(), `seed POST /api/contact failed for "${m.subject}"`).toBeTruthy();
    await new Promise((r) => setTimeout(r, 25));
  }
}

async function loginAsAdmin(api: APIRequestContext): Promise<void> {
  const res = await api.post("/api/login", {
    data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
  });
  expect(res.ok(), `admin login failed (${res.status()})`).toBeTruthy();
}

type ThreadGroupResp = {
  key: string;
  messageCount: number;
  unreadCount: number;
  memberIds: number[];
  latest: { id: number; email: string; subject: string; name: string };
};

async function fetchThreadGroups(api: APIRequestContext): Promise<ThreadGroupResp[]> {
  const res = await api.get("/api/admin/contacts/threads");
  expect(res.ok(), "GET /api/admin/contacts/threads failed").toBeTruthy();
  const json = await res.json();
  const arr = Array.isArray(json) ? json : (json?.threads ?? []);
  return arr as ThreadGroupResp[];
}

function findOurGroup(groups: ThreadGroupResp[]): ThreadGroupResp | undefined {
  return groups.find((g) => (g.latest?.email || "").toLowerCase() === SENDER_EMAIL);
}

async function cleanupSeededContacts(api: APIRequestContext): Promise<void> {
  try {
    const groups = await fetchThreadGroups(api);
    const ourGroup = findOurGroup(groups);
    const ids: number[] = ourGroup?.memberIds || [];
    for (const id of ids) {
      await api.delete(`/api/contact/${id}`).catch(() => undefined);
    }
  } catch {
    // best-effort
  }
}

test.describe("admin inbox — thread grouping regression", () => {
  let api: APIRequestContext;

  test.beforeAll(async ({ playwright }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL ?? "http://localhost:5000";
    api = await pwRequest.newContext({ baseURL });
    await seedContactMessages(api);
  });

  test.afterAll(async () => {
    if (api) {
      await loginAsAdmin(api).catch(() => undefined);
      await cleanupSeededContacts(api);
      await api.dispose();
    }
  });

  test("backend collapses sibling contacts into a single thread group", async () => {
    await loginAsAdmin(api);
    const groups = await fetchThreadGroups(api);
    const ourGroup = findOurGroup(groups);
    expect(ourGroup, `expected one thread group for ${SENDER_EMAIL}`).toBeTruthy();
    expect(ourGroup!.messageCount).toBe(SEED_MESSAGES.length);
    expect(Array.isArray(ourGroup!.memberIds)).toBeTruthy();
    expect(ourGroup!.memberIds.length).toBe(SEED_MESSAGES.length);
  });

  test("inbox UI shows one row, transcript, and thread-level spam mutation", async ({ page }) => {
    // Drive the UI through the same admin credentials used by the API context.
    await page.goto("/api/login");
    const loginRes = await page.request.post("/api/login", {
      data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    });
    expect(loginRes.ok(), "UI session login failed").toBeTruthy();

    await page.goto("/admin/inbox");

    // Wait for the search input as a signal the inbox shell finished loading.
    await expect(page.getByTestId("input-search")).toBeVisible({ timeout: 15_000 });

    // Filter the list down to our seeded thread so the assertions are deterministic
    // even when other contacts exist in the dev database.
    await page.getByTestId("input-search").fill(RUN_TAG);

    // ── Assertion 1: ONE row per conversation ────────────────────────────────
    // The "{N} messages" pill (badge-thread-count-*) is rendered only when a
    // group has more than one message. Exactly one such badge should match
    // the seeded thread.
    const threadCountBadges = page.locator('[data-testid^="badge-thread-count-"]');
    await expect(threadCountBadges).toHaveCount(1, { timeout: 15_000 });
    await expect(threadCountBadges.first()).toHaveText(String(SEED_MESSAGES.length));

    // Exactly one row button should be visible for the filtered seeded thread.
    const rowButtons = page.locator('[data-testid^="row-"][data-testid$="-button"]');
    await expect(rowButtons).toHaveCount(1);

    // ── Assertion 2: Transcript renders ALL messages in the thread ───────────
    await rowButtons.first().click();
    await expect(page.getByTestId("panel-thread-transcript")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("badge-thread-message-count")).toHaveText(
      new RegExp(`\\b${SEED_MESSAGES.length}\\b`),
    );
    const transcriptEntries = page.locator('[data-testid^="thread-entry-"][data-testid$="-toggle"], [data-testid^="thread-entry-"]:not([data-testid*="-toggle"]):not([data-testid*="-direction"]):not([data-testid*="-from"]):not([data-testid*="-date"]):not([data-testid*="-body"]):not([data-testid*="-translate"])');
    // Use the per-id "from" rows as a stable count of unique transcript entries.
    const fromRows = page.locator('[data-testid^="thread-entry-from-"]');
    await expect(fromRows).toHaveCount(SEED_MESSAGES.length);

    // ── Assertion 3: Thread-level spam moves EVERY sibling atomically ────────
    await page.getByTestId("button-report-spam").click();

    // Switch to Spam folder and confirm we still see exactly one row for the
    // thread (proves siblings were moved together, not duplicated).
    await page.getByTestId("tab-folder-spam").click();
    await page.getByTestId("input-search").fill(RUN_TAG);
    await expect(page.locator('[data-testid^="row-"][data-testid$="-button"]')).toHaveCount(1, {
      timeout: 15_000,
    });
    await expect(page.locator('[data-testid^="badge-thread-count-"]')).toHaveCount(1);
    await expect(
      page.locator('[data-testid^="badge-thread-count-"]').first(),
    ).toHaveText(String(SEED_MESSAGES.length));

    // Confirm Inbox no longer shows the row (no leftover sibling).
    await page.getByTestId("tab-folder-inbox").click();
    await page.getByTestId("input-search").fill(RUN_TAG);
    await expect(
      page.locator('[data-testid^="row-"][data-testid$="-button"]'),
    ).toHaveCount(0, { timeout: 15_000 });
  });
});
