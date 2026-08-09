import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const count = Number(sessionStorage.getItem("__document_load_count") ?? "0") + 1;
    sessionStorage.setItem("__document_load_count", String(count));
  });
});

test("landing page remains stable without document reloads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("A resume that feels like you.")).toBeVisible();
  await page.waitForTimeout(5_000);
  expect(await page.evaluate(() => Number(sessionStorage.getItem("__document_load_count")))).toBe(1);
});

test("editor remains stable after client navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore the editor" }).click();
  await expect(page.getByLabel("Resume title")).toHaveValue("Senior Product Designer");
  await page.waitForTimeout(5_000);
  expect(await page.evaluate(() => Number(sessionStorage.getItem("__document_load_count")))).toBe(1);
});

test("anonymous protected-route redirect settles on login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.waitForTimeout(5_000);
  expect(await page.evaluate(() => Number(sessionStorage.getItem("__document_load_count")))).toBe(1);
});
