import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", error => console.error(`Browser error: ${error.message}`));
  page.on("console", message => { if (message.type() === "error") console.error(`Browser console: ${message.text()}`); });
});

test("landing page opens the interactive editor", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("A resume that feels like you.")).toBeVisible();
  await page.getByRole("link", { name: "Explore the editor" }).click();
  await expect(page.getByLabel("Resume title")).toHaveValue("Senior Product Designer");
  await expect(page.getByRole("heading", { name: "Personal information" })).toBeVisible();
});

test("mobile editor can switch sections and preview", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/demo/resumes/demo-resume/edit");
  await page.getByLabel("Section").selectOption("summary");
  await expect(page.getByRole("heading", { name: "Professional summary" })).toBeVisible();
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByLabel("Preview of Senior Product Designer")).toBeVisible();
});

test("authentication form validates test-only credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
});

test("administrator routes reject anonymous visitors", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("public help center exposes support without administrator data", async ({ page }) => {
  await page.goto("/help");
  await expect(page.getByRole("heading", { name: "How can we help?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contact support" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});
