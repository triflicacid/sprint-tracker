import { test, expect } from "@playwright/test";
import { seedSprint, seedStory, seedSubtask } from "./seed.js";

test("subtask flow to done, including the pr comments detour, drives its story to done", async ({
    page,
    request,
}) => {
    // bounded around "today" rather than the seed default's open-ended
    // 2026-01-01 start - an ongoing sprint stretches through "today" in the
    // range calendar, which (as real time passes) can start overlapping
    // fixed 2026 date ranges other e2e specs assert on in that same shared
    // db (see timesheet.spec.ts's "sprints mode" tests)
    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);
    const sprint = await seedSprint(request, {
        name: `E2E Full Flow ${Date.now()}`,
        startDate,
        endDate: endDate.toISOString().slice(0, 10),
    });
    const story = await seedStory(request, sprint.id, { description: "e2e full-flow story" });
    const subtask = await seedSubtask(request, story.id, "e2e full-flow subtask");

    await page.goto(`/stories/${story.id}`);
    await expect(page.getByText("e2e full-flow subtask")).toBeVisible();

    // rejects an incomplete transition: NEW -> WIP requires a branch name
    await page.click(".subtask-row .status-flow >> text=wip");
    await page.click("text=confirm");
    await expect(page.locator(".toast-error")).toHaveText("Branch name is required for this transition");
    await expect(page.locator(".subtask-row .status-badge").first()).toHaveText("new");

    await page.fill('input[placeholder="Branch name"]', "feature/full-flow");
    await page.click("text=confirm");
    await expect(page.locator(".subtask-row .status-badge").first()).toHaveText("wip");

    await page.click(".subtask-row .status-flow >> text=in review");
    await page.fill('input[placeholder="Pull request URL"]', "https://github.com/example/full-flow-repo/pull/7");
    await page.click("text=confirm");
    await expect(page.locator(".subtask-row .status-badge").first()).toHaveText("in review");

    // the complexity selector only appears once a pr url exists
    await page.selectOption(".complexity-select", "3");
    await expect(page.locator(".complexity-select")).toHaveValue("3");

    // confirm is required even for transitions with no field to fill in
    await page.click(".subtask-row .status-flow >> text=pr comments");
    await page.click("text=confirm");
    await expect(page.locator(".subtask-row .status-badge").first()).toHaveText("pr comments");

    await page.click(".subtask-row .status-flow >> text=in review");
    await page.click("text=confirm");
    await expect(page.locator(".subtask-row .status-badge").first()).toHaveText("in review");

    await page.click(".subtask-row .status-flow >> text=cut release");
    await page.click("text=confirm");
    await expect(page.locator(".subtask-row .status-badge").first()).toHaveText("cut release");

    // releaseVersion is required leaving CUT_RELEASE (not entering it), so
    // the field appears on this transition, not the previous one
    await page.click(".subtask-row .status-flow >> text=testing");
    await page.fill('input[placeholder="Release version"]', "v1.2.3");
    await page.click("text=confirm");
    await expect(page.locator(".subtask-row .status-badge").first()).toHaveText("testing");
    await expect(page.getByText("v1.2.3")).toBeVisible();

    await page.click(".subtask-row .status-flow >> text=uat");
    await page.click("text=confirm");
    await expect(page.locator(".subtask-row .status-badge").first()).toHaveText("uat");

    // story stays at work-remaining while "awaiting more subtasks" is
    // checked, even though its only subtask has already reached done
    await page.click('.awaiting-more-subtasks input[type="checkbox"]');
    await page.click(".subtask-row .status-flow >> text=done");
    await page.click("text=confirm");
    await expect(page.locator(".subtask-row .status-badge").first()).toHaveText("done");
    await expect(page.locator(".page-header .status-badge")).toHaveText("work remaining");

    await page.click('.awaiting-more-subtasks input[type="checkbox"]');
    await expect(page.locator(".page-header .status-badge")).toHaveText("done");

    // done is a terminal state - no further transitions are offered
    await expect(page.locator(".subtask-row .status-flow-arrow")).toHaveCount(0);

    await page.click(".subtask-title");
    await expect(page).toHaveURL(new RegExp(`/subtasks/${subtask.id}$`));
    const lozenges = page.locator(".flow-chain .flow-node");
    await expect(lozenges).toHaveText([
        "new",
        "wip",
        "in review",
        "pr comments",
        "in review",
        "cut release",
        "testing",
        "uat",
        "done",
    ]);
});
