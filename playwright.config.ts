import { defineConfig } from "@playwright/test";

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;
const SYSTEM_CHROMIUM = process.env.PLAYWRIGHT_CHROMIUM_PATH || "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    launchOptions: {
      executablePath: SYSTEM_CHROMIUM,
    },
  },
});
