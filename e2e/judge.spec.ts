import { expect, test } from "@playwright/test";
import { alerts, openJudge, resultCards } from "./helpers";

test.describe("judge workspace in demo mode", () => {
  test("runs the sample automatically and shows the README's deterministic result", async ({ page }) => {
    await openJudge(page);

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Decisions, not scores.");
    await expect(page.locator(".demo-banner")).toContainText("Demo mode");
    await expect(page.locator(".usage-badge")).toContainText("Demo");

    const cards = resultCards(page);
    await expect(cards).toHaveCount(7);
    await expect(page.locator(".verdict-summary h2")).toHaveText(
      "3 of 7 checks passed. Review hedging language, em dash usage, filler phrases, and passive voice overuse. 1 check is low-confidence and worth a second look.",
    );
    await expect(page.locator(".verdict-summary .summary-note")).toContainText("Simulated");
    await expect(page.locator(".panel-heading .count").filter({ hasText: "passed" })).toHaveText("3/7 passed");

    // The first card is the hedging issue, open by default because it is an issue.
    const first = cards.first();
    await expect(first).toHaveAttribute("data-outcome", "issue");
    await expect(first).toHaveAttribute("open", "");
    await expect(first.locator(".result-score")).toHaveText("100%");
    await expect(first.locator(".evidence-quote figcaption")).toContainText("approximate");

    // Passes start collapsed.
    const pass = cards.filter({ has: page.locator('[data-outcome="pass"]') }).first();
    await expect(pass).not.toHaveAttribute("open", "");
  });

  test("threshold slider re-flags locally without a new run", async ({ page }) => {
    await openJudge(page);
    const flagged = page.locator(".summary-metrics strong.flag");
    await expect(flagged).toHaveText("1");

    const requests: string[] = [];
    page.on("request", (r) => r.url().includes("/api/judge") && requests.push(r.url()));

    const slider = page.getByRole("slider", { name: /Confidence threshold|Flag anything under/ });
    await slider.focus();
    // 70% -> 95% flags the 93%, 86%, and 75% results too.
    for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
    await expect(page.locator(".threshold label strong")).toHaveText("95%");
    await expect(flagged).toHaveText("4");
    expect(requests).toHaveLength(0);
  });

  test("expand all and collapse all override the defaults until the next run", async ({ page }) => {
    await openJudge(page);
    const cards = resultCards(page);
    await page.getByRole("button", { name: "Expand all" }).click();
    for (const card of await cards.all()) await expect(card).toHaveAttribute("open", "");

    await page.getByRole("button", { name: "Collapse all" }).click();
    for (const card of await cards.all()) await expect(card).not.toHaveAttribute("open", "");
  });

  test("editing the text marks the results stale, and re-running clears it", async ({ page }) => {
    await openJudge(page);
    await expect(page.locator(".panel .notice")).toHaveCount(0);
    await page.getByLabel("Paste the text to judge").fill("Mistakes were made. It is what it is.");
    await expect(page.locator(".panel .notice")).toContainText("Run again");
    await page.getByRole("button", { name: "Run judgment" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Judgment complete" })).toBeVisible();
    await expect(page.locator(".panel .notice")).toHaveCount(0);
  });

  test("refuses to run with no text and says so", async ({ page }) => {
    await openJudge(page);
    await page.getByLabel("Paste the text to judge").fill("");
    await expect(page.getByRole("button", { name: "Run judgment" })).toBeDisabled();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+Enter" : "Control+Enter");
    await expect(alerts(page)).toContainText("Add some text to judge first.");
  });

  test("export is enabled once there are results", async ({ page }) => {
    await openJudge(page);
    await expect(page.getByRole("button", { name: "Export" })).toBeEnabled();
  });
});
