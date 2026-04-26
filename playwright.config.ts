import { defineConfig } from "@playwright/test";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

function resolveChromium(): string | undefined {
  const fromEnv = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  for (const cmd of ["chromium", "chromium-browser", "google-chrome", "chrome"]) {
    try {
      const out = execSync(`command -v ${cmd}`, { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim();
      if (out && existsSync(out)) return out;
    } catch {
      // try next
    }
  }
  return undefined;
}

const chromiumPath = resolveChromium();

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
    launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
  },
});
