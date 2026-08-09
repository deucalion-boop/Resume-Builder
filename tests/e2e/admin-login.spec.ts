import "dotenv/config";
import { expect, test } from "@playwright/test";

const email = process.env.DEFAULT_ADMIN_EMAIL;
const password = process.env.DEFAULT_ADMIN_PASSWORD;

test("seeded administrator is routed to admin or required password setup", async ({ page }) => {
  test.skip(!email || !password, "Administrator credentials are not configured.");
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForTimeout(1_500);
  if (new URL(page.url()).pathname === "/login") {
    const notifications = await page.locator("[data-sonner-toast]").allTextContents();
    throw new Error(`Administrator login remained on /login. Notification: ${notifications.join(" ") || "none"}`);
  }
  await page.waitForURL(url => ["/admin", "/change-password"].includes(url.pathname), { timeout: 20_000 });
  if (new URL(page.url()).pathname === "/admin") {
    await expect(page.getByRole("heading", { name: "Platform overview" })).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { name: "Secure your administrator account" })).toBeVisible();
  }
});
