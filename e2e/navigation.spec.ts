import { expect, test } from "@playwright/test";

test.describe("shell navigation", () => {
  test("sidebar links reach the reference pages and mark the current one", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("link", { name: "Checks" }).click();
    await expect(page).toHaveURL(/\/checks$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Seven questions");
    await expect(page.locator(".ref-card")).toHaveCount(8);
    if (!isMobile) await expect(page.getByRole("link", { name: "Checks" })).toHaveAttribute("aria-current", "page");

    if (isMobile) await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("link", { name: "How it works" }).click();
    await expect(page).toHaveURL(/\/how-it-works$/);
    await expect(page.locator(".steps li")).toHaveCount(6);
    await expect(page.locator(".workspace-breadcrumb strong")).toHaveText("How it works");
  });

  test("the sidebar collapse state and theme persist across reloads", async ({ page, isMobile }) => {
    test.skip(isMobile, "the sidebar is a drawer on phones");
    await page.goto("/");
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(page.locator(".app-shell")).toHaveClass(/nav-collapsed/);

    const initial = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.getByRole("button", { name: /Switch to (light|dark) mode/ }).click();
    const flipped = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(flipped).not.toBe(initial);

    await page.reload();
    await expect(page.locator(".app-shell")).toHaveClass(/nav-collapsed/);
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(flipped);
  });

  test("the mobile drawer traps focus and closes on Escape", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phones only");
    await page.goto("/");
    const open = page.getByRole("button", { name: "Open navigation" });
    await open.click();
    await expect(page.locator(".app-shell")).toHaveClass(/nav-mobile-open/);
    await expect(page.getByRole("button", { name: "Close navigation" })).toBeFocused();

    // Tab cycles within the drawer.
    for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => !!document.activeElement?.closest(".sidebar"));
    expect(inside).toBe(true);

    await page.keyboard.press("Escape");
    await expect(page.locator(".app-shell")).not.toHaveClass(/nav-mobile-open/);
    await expect(open).toBeFocused();
  });

  test("social metadata and icons are served", async ({ page, request }) => {
    await page.goto("/checks");
    await expect(page).toHaveTitle(/Seven questions, not one score\. · Clarity Judge/);
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(og).toContain("/checks/opengraph-image");
    for (const path of ["/opengraph-image", "/checks/opengraph-image", "/how-it-works/opengraph-image", "/icon.svg", "/apple-icon"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
      expect(res.headers()["content-type"], path).toMatch(/image\//);
    }
  });
});
