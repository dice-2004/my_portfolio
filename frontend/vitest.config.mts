import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 単体テスト（npm test）。ブラウザを使わない純粋な関数だけを対象にする。画面の確認は e2e/（Playwright）
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"] },
});
