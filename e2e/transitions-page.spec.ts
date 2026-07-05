import { test, expect } from "@playwright/test";

test("transitions info page shows the full flow diagram and every state's description", async ({ page }) => {
    await page.goto("/#/");
    await page.click("text=transitions");
    await expect(page).toHaveURL(/#\/transitions/);

    await expect(page.locator(".flow-diagram")).toBeVisible();
    for (const label of ["new", "wip", "in pr", "in review", "pr comments", "cut release", "testing", "uat", "done"]) {
        await expect(page.locator(".flow-node", { hasText: label })).toBeVisible();
    }

    const descriptions = page.locator(".flow-state-description");
    await expect(descriptions).toHaveCount(9);
    for (const description of await descriptions.allTextContents()) {
        expect(description.length).toBeGreaterThan(0);
    }
});
