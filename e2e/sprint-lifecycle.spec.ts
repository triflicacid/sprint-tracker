import { test, expect } from "@playwright/test";

// Creates a sprint, story and subtask through the real UI, walks the
// subtask through status transitions (including required-field prompts),
// and confirms its detail page reflects the resulting history.
test("create a sprint, story and subtask, and walk the subtask through the flow", async ({ page }) => {
    const sprintName = `E2E Lifecycle ${Date.now()}`;

    await page.goto("/#/");
    await page.click("text=new sprint");
    await page.fill('input[placeholder="sprint name"]', sprintName);
    await page.fill('input[type="date"]', "2026-01-01");
    await page.click("text=create");

    await expect(page.getByText(sprintName)).toBeVisible();
    await page.click(`text=${sprintName}`);

    await page.click("text=new story");
    await page.fill('input[placeholder="jira link"]', "https://example.atlassian.net/browse/E2E-1");
    await page.fill('input[placeholder="description"]', "e2e story");
    await page.click("text=create");

    await expect(page.getByText("e2e story")).toBeVisible();
    await page.click("text=e2e story");

    await page.fill('input[placeholder="subtask description"]', "e2e subtask");
    await page.click("text=add subtask");
    await expect(page.getByText("e2e subtask")).toBeVisible();

    // NEW -> WIP requires a branch name
    await page.click(".subtask-row .status-flow >> text=wip");
    await page.fill('input[placeholder="Branch name"]', "feature/e2e");
    await page.click("text=confirm");
    await expect(page.locator(".subtask-row .status-badge").first()).toHaveText("wip");

    // WIP -> IN_REVIEW requires a pr url
    await page.click(".subtask-row .status-flow >> text=in review");
    await page.fill('input[placeholder="Pull request URL"]', "https://github.com/example/repo/pull/1");
    await page.click("text=confirm");
    await expect(page.locator(".subtask-row .status-badge").first()).toHaveText("in review");

    // clicking the row itself (not a control) navigates to the detail page
    await page.click(".subtask-description");
    await expect(page).toHaveURL(/#\/subtasks\/\d+/);
    await expect(page.locator(".flow-diagram")).toBeVisible();
    await expect(page.getByText("Activity calendar")).toBeVisible();
});
