import "dotenv/config";
import { expect, test } from "@playwright/test";

const enabled = process.env.E2E_ADMIN_TEST === "1" && Boolean(process.env.E2E_ADMIN_SECRET);

test.describe("temporary administrator", () => {
  test.skip(!enabled, "Set E2E_ADMIN_TEST=1 with dedicated test services to exercise authenticated administrator routes.");

  const email = `admin-e2e-${crypto.randomUUID()}@example.com`;
  const password = `E2E-${crypto.randomUUID()}-Strong!`;
  let userId = "";

  test.beforeAll(async ({ request }) => {
    const response = await request.post("/api/test/admin", { headers: { "x-e2e-secret": process.env.E2E_ADMIN_SECRET! }, data: { email, password } });
    expect(response.ok()).toBeTruthy();
    userId = (await response.json()).id;
  });

  test.afterAll(async ({ request }) => {
    if (!userId) return;
    await request.delete("/api/test/admin", { headers: { "x-e2e-secret": process.env.E2E_ADMIN_SECRET! }, data: { id: userId } });
  });

  test("signs in and reaches the isolated administrator workspace", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Platform overview" })).toBeVisible();
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "User management" })).toBeVisible();
    await expect(page.locator("#main-content").getByText(email, { exact: true })).toBeVisible();
  });
});
