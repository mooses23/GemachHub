import { test, expect } from "@playwright/test";

const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "admin123";

test.describe("bulk-send live progress bar — Task #142", () => {
  test("log bar appears, shows counter, and dialog closes after bulk send to selected locations", async ({ page }) => {
    // Authenticate the browser session
    const loginRes = await page.request.post("/api/login", {
      data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    });
    expect(loginRes.ok(), `admin login failed (${loginRes.status()})`).toBeTruthy();

    // Navigate to the admin locations page
    await page.goto("/admin/locations");

    // Wait for the locations table to load — at least one location row must be present
    const firstCheckbox = page.locator('[data-testid^="checkbox-location-"]').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 20_000 });

    // Select the first two location checkboxes
    const checkboxes = page.locator('[data-testid^="checkbox-location-"]');
    const count = await checkboxes.count();
    expect(count, "Need at least 2 location rows to run bulk-send test").toBeGreaterThanOrEqual(2);

    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // The "Message Selected (N)" button should now be visible
    const bulkSelectedBtn = page.getByTestId("button-onboarding-bulk-selected");
    await expect(bulkSelectedBtn).toBeVisible({ timeout: 10_000 });
    await bulkSelectedBtn.click();

    // The send dialog should open — wait for the confirm button
    const confirmBtn = page.getByTestId("button-send-welcome-confirm");
    await expect(confirmBtn).toBeVisible({ timeout: 10_000 });

    // Trigger the bulk send
    await confirmBtn.click();

    // ── Assert: log bar appears ────────────────────────────────────────────
    // The bar is rendered as soon as streamState is set (before the first
    // progress event arrives), so it should appear very quickly.
    const logBar = page.getByTestId("bulk-send-log-bar");
    await expect(logBar).toBeVisible({ timeout: 10_000 });

    // The log text should initially contain "Starting…" or a "Preparing" message
    const logText = page.getByTestId("bulk-send-log-text");
    await expect(logText).toBeVisible({ timeout: 5_000 });

    // ── Assert: counter shows n/total progress ─────────────────────────────
    // After the "start" SSE event arrives, total > 0 and the counter renders.
    const logCounter = page.getByTestId("bulk-send-log-counter");
    await expect(logCounter).toBeVisible({ timeout: 15_000 });

    // Counter must match the "N/M" pattern where N and M are positive integers
    await expect(logCounter).toHaveText(/^\d+\/\d+$/, { timeout: 15_000 });

    // ── Assert: at least one progress entry shows a location name ──────────
    // After at least one send completes, the log text changes from "Preparing…"
    // to something like "✓ Location Name", "↩ Location Name", or "✗ Location Name".
    await expect(logText).toHaveText(/[✓✗↩]\s+\S/, { timeout: 30_000 });

    // ── Assert: "Bulk messages sent" toast appears after the stream ends ────
    // The toast title is always "Bulk messages sent" (even when all are skipped
    // or failed — the server always emits the done summary). Twilio may not be
    // configured in the test environment, so we accept any variant value but
    // require the specific title text.
    const toast = page.locator('[data-sonner-toast], [role="status"]')
      .filter({ hasText: /Bulk messages sent/i })
      .first();
    await expect(toast).toBeVisible({ timeout: 60_000 });

    // ── Assert: dialog is closed after completion ───────────────────────────
    await expect(confirmBtn).not.toBeVisible({ timeout: 10_000 });

    // ── Assert: log bar is gone after dialog closes ─────────────────────────
    await expect(logBar).not.toBeVisible({ timeout: 5_000 });
  });
});
