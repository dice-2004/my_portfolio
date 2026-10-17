import { defineConfig, devices } from "@playwright/test";

// 画面の確認（npm run test:e2e）。Go のバックエンドと本番ビルドのフロントエンドを起動して、ブラウザで開く。
// Go と Node が入っていれば動く。Gemini のキーは渡さないので、AI チャットは無効のまま確かめる。
const BACKEND = "http://localhost:18080";
const FRONTEND = "http://localhost:3100";

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: FRONTEND,
    trace: "retain-on-failure",
    // ブラウザを別の場所に入れてある環境向け（ふだんは不要）
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "go run ./cmd/server",
      cwd: "../backend",
      url: `${BACKEND}/api/health`,
      env: { PORT: "18080", DB_PATH: "tmp/e2e/portfolio.db", GEMINI_API_KEY: "", GIN_MODE: "release" },
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      // 本番と同じ standalone の server.js で動かす（Dockerfile.frontend と同じファイルの置き方）
      command:
        "npm run build && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/ && node .next/standalone/server.js",
      url: FRONTEND,
      env: { BACKEND_URL: BACKEND, PORT: "3100", HOSTNAME: "localhost" },
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});
