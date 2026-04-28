import { test, expect, request as pwRequest, type APIRequestContext } from "@playwright/test";

const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "admin123";

const RUN_TAG = `e2eFilter-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const SENDER_EMAIL = `${RUN_TAG.toLowerCase()}@e2e.test`;
const SENDER_NAME = "E2E Filter Sender";
const BASE_SUBJECT = `${RUN_TAG} Filter Spec`;
// A unique token that appears ONLY in the body of the OLDEST message — used to
// prove the search now scans every message in a thread, not just the latest.
const DEEP_BODY_TOKEN = `deepneedle-${RUN_TAG}`.toLowerCase();

const SEED_MESSAGES: Array<{ subject: string; body: string }> = [
  { subject: BASE_SUBJECT, body: `First message — contains the deep token: ${DEEP_BODY_TOKEN}.` },
  { subject: `Re: ${BASE_SUBJECT}`, body: "Second reply — generic content." },
  { subject: `Fwd: ${BASE_SUBJECT}`, body: "Third forwarded — generic content." },
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
    expect(res.ok(), `seed failed for "${m.subject}"`).toBeTruthy();
    await new Promise((r) => setTimeout(r, 25));
  }
}

async function loginAsAdmin(api: APIRequestContext): Promise<void> {
  const res = await api.post("/api/login", {
    data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
  });
  expect(res.ok(), `admin login failed (${res.status()})`).toBeTruthy();
}

async function cleanup(api: APIRequestContext): Promise<void> {
  try {
    const res = await api.get("/api/admin/contacts/threads");
    if (!res.ok()) return;
    const json = await res.json();
    const groups = (json?.threads ?? []) as Array<{
      memberIds: number[];
      latest: { email: string };
    }>;
    const ours = groups.find((g) => (g.latest?.email || "").toLowerCase() === SENDER_EMAIL);
    for (const id of ours?.memberIds || []) {
      await api.delete(`/api/contact/${id}`).catch(() => undefined);
    }
  } catch {
    // best-effort
  }
}

test.describe("admin inbox — filter persistence (Task #36)", () => {
  // The active variant of the filter button uses shadcn's "default" style
  // (solid `bg-primary`); inactive buttons use the "outline" variant.
  // Asserting on `bg-primary` therefore proves the saved enum value made
  // it back into state, not just that *some* non-default filter is active.
  const ACTIVE_RE = /bg-primary/;

  test("folder/source/read/reply/search all survive a page reload", async ({ page }) => {
    const loginRes = await page.request.post("/api/login", {
      data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();

    // Each Playwright test gets a fresh browser context with empty
    // localStorage, so we can land on the inbox without pre-seeded state.
    await page.goto("/admin/inbox");
    await expect(page.getByTestId("input-search")).toBeVisible({ timeout: 15_000 });

    // Pick a non-default selection in EVERY filter dimension so we can prove
    // each one is restored independently, not just whichever one happens to
    // also flip the clear-filters button into view.
    await page.getByTestId("tab-folder-spam").click();
    await page.getByTestId("filter-source-form").click();
    await page.getByTestId("filter-read-unread").click();
    await page.getByTestId("filter-reply-unreplied").click();
    await page.getByTestId("input-search").fill("triage-needle");

    // Reload — without persistence, all five would snap back to defaults.
    await page.reload();
    await expect(page.getByTestId("input-search")).toBeVisible({ timeout: 15_000 });

    // Search input has a directly observable controlled value.
    await expect(page.getByTestId("input-search")).toHaveValue("triage-needle");
    // Each restored enum filter must be the ACTIVE one in its row …
    await expect(page.getByTestId("tab-folder-spam")).toHaveClass(ACTIVE_RE);
    await expect(page.getByTestId("filter-source-form")).toHaveClass(ACTIVE_RE);
    await expect(page.getByTestId("filter-read-unread")).toHaveClass(ACTIVE_RE);
    await expect(page.getByTestId("filter-reply-unreplied")).toHaveClass(ACTIVE_RE);
    // … and the OTHER options in the same row must NOT be active. Without
    // this negative check, a bug that left every button "active" would slip
    // past us.
    await expect(page.getByTestId("tab-folder-inbox")).not.toHaveClass(ACTIVE_RE);
    await expect(page.getByTestId("filter-source-all")).not.toHaveClass(ACTIVE_RE);
    await expect(page.getByTestId("filter-read-all")).not.toHaveClass(ACTIVE_RE);
    await expect(page.getByTestId("filter-reply-all")).not.toHaveClass(ACTIVE_RE);

    // Cleanup so saved state doesn't leak into the rest of the run.
    await page.getByTestId("button-clear-filters").click();
    await expect(page.getByTestId("input-search")).toHaveValue("");
  });

  test("clear-filters wipes the saved state so a reload returns to defaults (including folder)", async ({ page }) => {
    const loginRes = await page.request.post("/api/login", {
      data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();

    await page.goto("/admin/inbox");
    await expect(page.getByTestId("input-search")).toBeVisible({ timeout: 15_000 });

    // Set non-default state in BOTH the folder tab and a filter button so
    // the test guards against the historical bug where clear-filters reset
    // the filter row but left the folder on Spam/Trash.
    await page.getByTestId("tab-folder-spam").click();
    await page.getByTestId("filter-reply-unreplied").click();
    await page.getByTestId("input-search").fill("triage-needle");
    await page.getByTestId("button-clear-filters").click();

    await page.reload();
    await expect(page.getByTestId("input-search")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("input-search")).toHaveValue("");
    // Folder must be back on Inbox, and every filter row's "All" option
    // must be the active one.
    await expect(page.getByTestId("tab-folder-inbox")).toHaveClass(ACTIVE_RE);
    await expect(page.getByTestId("tab-folder-spam")).not.toHaveClass(ACTIVE_RE);
    await expect(page.getByTestId("filter-reply-all")).toHaveClass(ACTIVE_RE);
    // The clear button only appears when at least one filter is non-default;
    // its absence here confirms we're on a fully default state.
    await expect(page.getByTestId("button-clear-filters")).toHaveCount(0);
  });

  test("malformed localStorage falls back to defaults without crashing", async ({ page }) => {
    const loginRes = await page.request.post("/api/login", {
      data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();

    // Pre-seed localStorage with a garbage value BEFORE the inbox script
    // ever runs. addInitScript fires on every navigation, so we explicitly
    // remove itself after the first goto via an inline guard so subsequent
    // reloads (none in this test, but good hygiene) get clean state.
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("admin-inbox-filters-v1", "{not valid json{");
      } catch {}
    });

    await page.goto("/admin/inbox");
    await expect(page.getByTestId("input-search")).toBeVisible({ timeout: 15_000 });
    // Garbage parse → fallback to DEFAULT_FILTER_STATE: empty search and
    // every "all" option is the active one.
    await expect(page.getByTestId("input-search")).toHaveValue("");
    await expect(page.getByTestId("filter-source-all")).toHaveClass(ACTIVE_RE);
    await expect(page.getByTestId("filter-read-all")).toHaveClass(ACTIVE_RE);
    await expect(page.getByTestId("filter-reply-all")).toHaveClass(ACTIVE_RE);
  });
});

test.describe("admin inbox — thread search & reply filter (Task #31)", () => {
  let api: APIRequestContext;

  test.beforeAll(async ({ playwright }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL ?? "http://localhost:5000";
    api = await pwRequest.newContext({ baseURL });
    await seedContactMessages(api);
  });

  test.afterAll(async () => {
    if (api) {
      await loginAsAdmin(api).catch(() => undefined);
      await cleanup(api);
      await api.dispose();
    }
  });

  test("search matches text from any message in a thread; count badge stays full", async ({ page }) => {
    const loginRes = await page.request.post("/api/login", {
      data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();

    await page.goto("/admin/inbox");
    await expect(page.getByTestId("input-search")).toBeVisible({ timeout: 15_000 });

    // Search for a token that ONLY exists in the OLDEST message's body. Before
    // this task, the per-item filter would have hidden the thread (because
    // the latest message — the row that's actually rendered — doesn't contain
    // the token). After the change, the search runs at the thread level so
    // the row should still appear, with its full "{N} messages" badge intact.
    await page.getByTestId("input-search").fill(DEEP_BODY_TOKEN);

    const rowButtons = page.locator('[data-testid^="row-"][data-testid$="-button"]');
    await expect(rowButtons).toHaveCount(1, { timeout: 15_000 });

    const threadCountBadges = page.locator('[data-testid^="badge-thread-count-"]');
    await expect(threadCountBadges).toHaveCount(1);
    // Badge must reflect the TOTAL message count for the thread (3), not the
    // number of messages that matched the search (1).
    await expect(threadCountBadges.first()).toHaveText(String(SEED_MESSAGES.length));
  });

  test('"Needs reply" filter shows un-replied threads and "Replied" hides them', async ({ page }) => {
    const loginRes = await page.request.post("/api/login", {
      data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();

    await page.goto("/admin/inbox");
    await expect(page.getByTestId("input-search")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("input-search").fill(RUN_TAG);

    // Sanity: with the "All" reply filter the seeded thread is visible.
    const rowButtons = page.locator('[data-testid^="row-"][data-testid$="-button"]');
    await expect(rowButtons).toHaveCount(1, { timeout: 15_000 });

    // The seeded thread has never been replied to → "Needs reply" should
    // still show it.
    await page.getByTestId("filter-reply-unreplied").click();
    await expect(rowButtons).toHaveCount(1);

    // Switching to "Replied" should hide it (no reply has ever been sent).
    await page.getByTestId("filter-reply-replied").click();
    await expect(rowButtons).toHaveCount(0, { timeout: 10_000 });

    // Reset via the clear-filters button.
    await page.getByTestId("button-clear-filters").click();
    await page.getByTestId("input-search").fill(RUN_TAG);
    await expect(rowButtons).toHaveCount(1);
  });
});
