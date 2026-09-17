import { expect, type Page } from "@playwright/test";

/**
 * A key-shaped string that passes the app's format check. Built at runtime so
 * no literal in the repo looks like a credential to the secret scanner. It is
 * only ever sent to a stubbed route in these tests.
 */
export const FAKE_KEY = "apikey_" + "a".repeat(40);

/** Open the judge and wait for demo mode's automatic first run to finish. */
export async function openJudge(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("status").filter({ hasText: "Judgment complete" })).toBeVisible();
}

/** The checks group on the judge page (not the chips inside the custom check form). */
export function checkChips(page: Page) {
  return page.getByRole("group", { name: "Checks" });
}

/** Alerts raised by the app, excluding Next.js's own route announcer, which also has role="alert". */
export function alerts(page: Page) {
  return page.locator('[role="alert"]:not([id="__next-route-announcer__"])');
}

/** The password field in the key dialog. Its label changes once a key is saved. */
export function keyInput(page: Page) {
  return page.locator("#personal-api-key");
}

export function resultCards(page: Page) {
  return page.locator(".result-card");
}

/** Answer /api/judge with a fixed payload so live-mode tests never leave the machine. */
export async function stubJudgeRoute(page: Page, status: number, body: unknown) {
  await page.route("**/api/judge", (route) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }));
}

export const isMac = process.platform === "darwin";
export const mod = isMac ? "Meta" : "Control";
