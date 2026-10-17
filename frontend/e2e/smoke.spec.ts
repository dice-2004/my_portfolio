import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("トップに作品・経歴・スキル・連絡先が出る", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  for (const name of ["作品", "経歴", "スキル", "連絡先"]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  // バックエンドの seeds から作品が読めている
  expect(await page.locator('a[href^="/works/"]').count()).toBeGreaterThan(0);
});

test("作品ページを開ける", async ({ page }) => {
  await page.goto("/");
  const first = page.locator('a[href^="/works/"]').first();
  const href = await first.getAttribute("href");
  await first.click();
  await expect(page).toHaveURL(href!);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("CLI パネルでコマンドを実行できる", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "dice に質問する" }).click();
  const panel = page.locator("#cli-panel");
  await expect(panel).toHaveAttribute("data-open", "true");

  const input = panel.getByRole("combobox");
  await input.fill("/w");
  await expect(panel.getByRole("option")).toHaveCount(2);

  await input.fill("/works");
  await input.press("Enter");
  await expect(panel).toContainText("/open <n> で n 番の作品ページを開きます。");

  await input.fill("/open 1");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/works\/\d+$/);
});

test("文字と背景のコントラストが足りている（axe）", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  expect(results.violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(" ")}: ${n.failureSummary}`))).toEqual([]);
});
